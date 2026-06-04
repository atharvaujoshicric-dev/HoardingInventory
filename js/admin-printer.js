// ============================================================
// SPYDEE v3 — Super Admin (Full Powers) + Flex Printer
// ============================================================

function renderAdminView() {
  const tab=AppState.adminTab||'overview';
  const tabs=[
    {id:'overview',icon:'📊',label:'Overview'},
    {id:'vendors',icon:'🏗',label:'Vendors'},
    {id:'customers',icon:'📢',label:'Customers'},
    {id:'printers',icon:'🖨',label:'Printers'},
    {id:'hoardings',icon:'📍',label:'Hoardings'},
    {id:'bookings',icon:'📋',label:'Bookings'},
    {id:'printjobs',icon:'⚙️',label:'Print Jobs'},
    {id:'revenue',icon:'💰',label:'Revenue'},
    {id:'payouts',icon:'💸',label:'Payouts'},
  ];
  return `<div class="admin-view">
    <div class="admin-tab-bar">
      ${tabs.map(t=>`<button class="admin-subtab ${tab===t.id?'active':''}" onclick="setAdminTab('${t.id}')">${t.icon} ${t.label}</button>`).join('')}
    </div>
    <div class="admin-tab-content">
      ${tab==='overview'?renderAdminOverview():''}
      ${tab==='vendors'?renderAdminVendors():''}
      ${tab==='customers'?renderAdminCustomers():''}
      ${tab==='printers'?renderAdminPrinters():''}
      ${tab==='hoardings'?renderAdminHoardings():''}
      ${tab==='bookings'?renderAdminBookings():''}
      ${tab==='printjobs'?renderAdminPrintJobs():''}
      ${tab==='revenue'?renderAdminRevenue():''}
      ${tab==='payouts'?renderAdminPayouts():''}
    </div>
  </div>`;
}

function setAdminTab(t){ AppState.adminTab=t; renderDashboard(); }

// ── Overview ──────────────────────────────────────────────────
function renderAdminOverview() {
  const vendors=SPYDEE_DATA.users.filter(u=>u.role==='vendor');
  const customers=SPYDEE_DATA.users.filter(u=>u.role==='customer');
  const printers=SPYDEE_DATA.users.filter(u=>u.role==='printer');
  const confirmed=SPYDEE_DATA.bookings.filter(b=>b.status==='confirmed');
  const totalGMV=confirmed.reduce((s,b)=>s+(b.totalDue||0),0);
  const platformFee=Math.round(totalGMV*0.05);
  const pendingVerify=SPYDEE_DATA.hoardings.filter(h=>!h.verified).length;
  const openJobs=SPYDEE_DATA.printJobs.filter(j=>j.status==='open').length;
  const rev=AppState.getRevenueData();
  const maxRev=Math.max(...rev.map(r=>r.revenue),1);

  return `<div class="admin-overview">
    <div class="admin-stats-grid">
      <div class="admin-stat-card"><div class="asc-icon">🏗</div><div class="asc-value">${vendors.length}</div><div class="asc-label">Vendors</div></div>
      <div class="admin-stat-card"><div class="asc-icon">📢</div><div class="asc-value">${customers.length}</div><div class="asc-label">Advertisers</div></div>
      <div class="admin-stat-card"><div class="asc-icon">🖨</div><div class="asc-value">${printers.length}</div><div class="asc-label">Printers</div></div>
      <div class="admin-stat-card"><div class="asc-icon">📍</div><div class="asc-value">${SPYDEE_DATA.hoardings.length}</div><div class="asc-label">Hoardings</div></div>
      <div class="admin-stat-card highlight"><div class="asc-icon">💰</div><div class="asc-value">${formatCurrency(totalGMV)}</div><div class="asc-label">Total GMV</div></div>
      <div class="admin-stat-card"><div class="asc-icon">🏦</div><div class="asc-value">${formatCurrency(platformFee)}</div><div class="asc-label">Platform Rev (5%)</div></div>
      <div class="admin-stat-card"><div class="asc-icon">📋</div><div class="asc-value">${SPYDEE_DATA.bookings.length}</div><div class="asc-label">Bookings</div></div>
      <div class="admin-stat-card ${pendingVerify>0?'alert-card':''}"><div class="asc-icon">⏳</div><div class="asc-value">${pendingVerify}</div><div class="asc-label">Pending Approval</div></div>
      <div class="admin-stat-card"><div class="asc-icon">🖨</div><div class="asc-value">${openJobs}</div><div class="asc-label">Open Print Jobs</div></div>
    </div>

    <div class="admin-chart-card">
      <h3>📈 Monthly Revenue (GMV)</h3>
      <div class="mini-bar-chart">
        ${rev.map(r=>`<div class="bar-col">
          <div class="bar-tooltip">${formatCurrency(r.revenue)}<br>${r.bookings} booking(s)</div>
          <div class="bar-fill" style="height:${r.revenue?Math.max(8,(r.revenue/maxRev)*120):4}px;background:${r.revenue>0?'var(--amber)':'var(--bg-surface)'}"></div>
          <div class="bar-label">${r.month.slice(5)}</div>
        </div>`).join('')}
      </div>
    </div>

    <div class="admin-quick-actions">
      <h3>⚡ Quick Actions</h3>
      <div class="qa-grid">
        <button onclick="setAdminTab('hoardings')" class="qa-btn"><span class="qa-icon">✅</span><span>Approve ${pendingVerify} Hoardings</span></button>
        <button onclick="setAdminTab('vendors')" class="qa-btn"><span class="qa-icon">🏗</span><span>Manage Vendors</span></button>
        <button onclick="setAdminTab('revenue')" class="qa-btn"><span class="qa-icon">📊</span><span>Revenue Report</span></button>
        <button onclick="adminBroadcastModal()" class="qa-btn"><span class="qa-icon">📣</span><span>Broadcast Notification</span></button>
        <button onclick="adminAddUserModal()" class="qa-btn"><span class="qa-icon">➕</span><span>Add User</span></button>
        <button onclick="if(confirm('Reset all demo data?')) AppState.reset()" class="qa-btn qa-danger"><span class="qa-icon">🔄</span><span>Reset Demo Data</span></button>
      </div>
    </div>

    <div class="admin-activity">
      <h3>🕐 Activity Feed</h3>
      <div class="activity-feed">
        ${[...SPYDEE_DATA.bookings].reverse().slice(0,4).map(b=>{
          const c=SPYDEE_DATA.users.find(u=>u.id===b.customerId);
          const h=SPYDEE_DATA.hoardings.find(x=>x.id===b.hoardingId);
          return `<div class="activity-item"><span class="act-icon">📋</span><span><strong>${c?.name}</strong> booked <strong>${h?.title?.split(' ').slice(0,2).join(' ')}</strong></span><span class="act-time">${b.createdAt}</span></div>`;
        }).join('')}
        ${SPYDEE_DATA.printJobs.slice(-3).reverse().map(pj=>{
          const c=SPYDEE_DATA.users.find(u=>u.id===pj.customerId);
          return `<div class="activity-item"><span class="act-icon">🖨</span><span><strong>${c?.name}</strong> created print job <strong>${pj.id}</strong></span><span class="act-time">${pj.createdAt}</span></div>`;
        }).join('')}
        ${SPYDEE_DATA.hoardings.filter(h=>!h.verified).slice(0,3).map(h=>{
          const v=SPYDEE_DATA.users.find(u=>u.id===h.vendorId);
          return `<div class="activity-item"><span class="act-icon">⏳</span><span><strong>${v?.name}</strong> added hoarding <strong>${h.title?.split(' ').slice(0,2).join(' ')}</strong> (pending)</span><span class="act-time">${h.createdAt||'recent'}</span></div>`;
        }).join('')}
      </div>
    </div>
  </div>`;
}

// ── Vendors ───────────────────────────────────────────────────
function renderAdminVendors() {
  const vendors=SPYDEE_DATA.users.filter(u=>u.role==='vendor');
  return `<div class="admin-section-full">
    <div class="section-header-row">
      <h3>🏗 Vendor Management</h3>
      <span class="count-badge">${vendors.length} vendors</span>
    </div>
    <div class="admin-cards-grid">
      ${vendors.map(v=>`<div class="user-mgmt-card ${v.suspended?'suspended':''}">
        <div class="umc-header">
          <div class="umc-avatar">${v.name.charAt(0)}</div>
          <div class="umc-info">
            <strong>${v.name}</strong><span>${v.company}</span>
            <div class="umc-badges">
              <span class="status-badge ${v.verified?'status-confirmed':'status-hold'}">${v.verified?'✓ Verified':'Pending'}</span>
              ${v.suspended?'<span class="status-badge status-cancelled">Suspended</span>':''}
            </div>
          </div>
        </div>
        <div class="umc-details">
          <div class="umc-row"><span>📧</span><span>${v.email}</span></div>
          <div class="umc-row"><span>📱</span><span>${v.mobile}</span></div>
          <div class="umc-row"><span>🏢</span><span class="gst-code">${v.gst||'—'}</span></div>
          <div class="umc-row"><span>📍</span><span>${v.inventoryIds?.length||0} hoardings</span></div>
          <div class="umc-row"><span>💳</span><span>${formatCurrency(v.wallet)}</span></div>
          <div class="umc-row"><span>💵</span><span>${formatCurrency(v.totalEarnings||0)} earned</span></div>
          <div class="umc-row"><span>📅</span><span>Joined ${v.createdAt}</span></div>
        </div>
        <div class="umc-actions">
          ${!v.verified?`<button onclick="adminVerifyUser('${v.id}')" class="umc-btn umc-green">✓ Verify</button>`:''}
          ${!v.otpVerified?`<button onclick="adminForceVerifyUser('${v.id}')" class="umc-btn umc-blue">Force OTP</button>`:''}
          <button onclick="adminTopUpModal('${v.id}')" class="umc-btn umc-amber">💳 Top-up</button>
          <button onclick="adminEditUserModal('${v.id}')" class="umc-btn">✏️ Edit</button>
          <button onclick="adminSuspendUser('${v.id}')" class="umc-btn ${v.suspended?'umc-green':'umc-red'}">${v.suspended?'▶ Unsuspend':'⛔ Suspend'}</button>
          <button onclick="adminDeleteUser('${v.id}')" class="umc-btn umc-red">🗑 Delete</button>
        </div>
      </div>`).join('')}
    </div>
  </div>`;
}

// ── Customers ─────────────────────────────────────────────────
function renderAdminCustomers() {
  const customers=SPYDEE_DATA.users.filter(u=>u.role==='customer');
  return `<div class="admin-section-full">
    <div class="section-header-row">
      <h3>📢 Customer Management</h3>
      <span class="count-badge">${customers.length} customers</span>
    </div>
    <div class="admin-cards-grid">
      ${customers.map(c=>{
        const myBk=SPYDEE_DATA.bookings.filter(b=>b.customerId===c.id);
        return `<div class="user-mgmt-card ${c.suspended?'suspended':''}">
          <div class="umc-header">
            <div class="umc-avatar customer-av">${c.name.charAt(0)}</div>
            <div class="umc-info"><strong>${c.name}</strong><span>${c.company||'Individual'}</span>
              <div class="umc-badges">
                <span class="status-badge ${c.otpVerified?'status-confirmed':'status-hold'}">${c.otpVerified?'✓ Verified':'Unverified'}</span>
                ${c.suspended?'<span class="status-badge status-cancelled">Suspended</span>':''}
              </div>
            </div>
          </div>
          <div class="umc-details">
            <div class="umc-row"><span>📧</span><span>${c.email}</span></div>
            <div class="umc-row"><span>📱</span><span>${c.mobile}</span></div>
            <div class="umc-row"><span>🏢</span><span class="gst-code">${c.gst||'No GST'}</span></div>
            <div class="umc-row"><span>💳</span><span>${formatCurrency(c.wallet)}</span></div>
            <div class="umc-row"><span>📋</span><span>${myBk.length} bookings · ${myBk.filter(b=>b.status==='confirmed').length} active</span></div>
            <div class="umc-row"><span>💸</span><span>${formatCurrency(c.totalSpend||0)} total spend</span></div>
            <div class="umc-row"><span>🔐</span><span>${c.loginCount||0} logins</span></div>
            <div class="umc-row"><span>📅</span><span>Joined ${c.createdAt}</span></div>
          </div>
          <div class="umc-actions">
            ${!c.otpVerified?`<button onclick="adminForceVerifyUser('${c.id}')" class="umc-btn umc-blue">Force Verify</button>`:''}
            <button onclick="adminTopUpModal('${c.id}')" class="umc-btn umc-amber">💳 Top-up</button>
            <button onclick="adminViewBookings('${c.id}')" class="umc-btn umc-blue">📋 Bookings</button>
            <button onclick="adminEditUserModal('${c.id}')" class="umc-btn">✏️ Edit</button>
            <button onclick="adminSuspendUser('${c.id}')" class="umc-btn ${c.suspended?'umc-green':'umc-red'}">${c.suspended?'▶ Unsuspend':'⛔ Suspend'}</button>
            <button onclick="adminDeleteUser('${c.id}')" class="umc-btn umc-red">🗑 Delete</button>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ── Printers ──────────────────────────────────────────────────
function renderAdminPrinters() {
  const printers=SPYDEE_DATA.users.filter(u=>u.role==='printer');
  return `<div class="admin-section-full">
    <div class="section-header-row">
      <h3>🖨 Printer Management</h3>
      <span class="count-badge">${printers.length} printers</span>
    </div>
    <div class="admin-cards-grid">
      ${printers.map(p=>{
        const myJobs=SPYDEE_DATA.printJobs.filter(j=>j.printerId===p.id);
        return `<div class="user-mgmt-card ${p.suspended?'suspended':''}">
          <div class="umc-header">
            <div class="umc-avatar printer-av">${p.name.charAt(0)}</div>
            <div class="umc-info"><strong>${p.name}</strong><span>${p.company}</span>
              <div class="umc-badges">
                <span class="status-badge ${p.otpVerified?'status-confirmed':'status-hold'}">${p.otpVerified?'✓ Active':'Pending'}</span>
                ${p.suspended?'<span class="status-badge status-cancelled">Suspended</span>':''}
              </div>
            </div>
          </div>
          <div class="umc-details">
            <div class="umc-row"><span>📧</span><span>${p.email}</span></div>
            <div class="umc-row"><span>📱</span><span>${p.mobile}</span></div>
            <div class="umc-row"><span>🏢</span><span class="gst-code">${p.gst||'—'}</span></div>
            <div class="umc-row"><span>💳</span><span>${formatCurrency(p.wallet)}</span></div>
            <div class="umc-row"><span>⚙️</span><span>${myJobs.filter(j=>j.status==='in-progress').length} active jobs</span></div>
            <div class="umc-row"><span>✅</span><span>${myJobs.filter(j=>j.status==='dispatched').length} completed</span></div>
            <div class="umc-row"><span>💵</span><span>${formatCurrency(p.totalEarnings||0)} earned</span></div>
          </div>
          <div class="umc-actions">
            <button onclick="adminTopUpModal('${p.id}')" class="umc-btn umc-amber">💳 Top-up</button>
            <button onclick="adminEditUserModal('${p.id}')" class="umc-btn">✏️ Edit</button>
            <button onclick="adminSuspendUser('${p.id}')" class="umc-btn ${p.suspended?'umc-green':'umc-red'}">${p.suspended?'▶ Unsuspend':'⛔ Suspend'}</button>
            <button onclick="adminDeleteUser('${p.id}')" class="umc-btn umc-red">🗑 Delete</button>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ── Hoardings ─────────────────────────────────────────────────
function renderAdminHoardings() {
  const all=SPYDEE_DATA.hoardings;
  return `<div class="admin-section-full">
    <div class="section-header-row">
      <h3>📍 Hoarding Management</h3>
      <div style="display:flex;gap:8px">
        <span class="count-badge">${all.length} total</span>
        <span class="count-badge" style="background:var(--amber-soft);color:var(--amber)">${all.filter(h=>!h.verified).length} pending</span>
      </div>
    </div>
    <div class="admin-hoarding-list">
      ${all.map(h=>{
        const vendor=SPYDEE_DATA.users.find(u=>u.id===h.vendorId);
        const bkCount=SPYDEE_DATA.bookings.filter(b=>b.hoardingId===h.id).length;
        const sc={available:'var(--green)','on-hold':'var(--amber)',booked:'var(--red)'};
        return `<div class="admin-hoarding-row ${!h.verified?'pending-row':''}">
          <div class="ahr-billboard">
            <div class="ahr-face ${h.type==='Digital LED'?'bb-digital':h.type==='Backlit'?'bb-backlit':'bb-flex'}"
                 style="width:64px;height:32px;display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--text-muted)">
              ${h.width}×${h.height}
            </div>
          </div>
          <div class="ahr-info">
            <div class="ahr-title-row">
              <strong>${h.title}</strong>
              <span class="mini-status" style="background:${sc[h.status]||'#999'}20;color:${sc[h.status]||'#999'}">${h.status}</span>
              ${h.verified?'<span class="verified-dot">✓ Verified</span>':'<span class="pending-dot">⏳ Pending</span>'}
              ${h.featured?'<span style="color:var(--amber);font-size:11px">⭐ Featured</span>':''}
            </div>
            <span class="ahr-loc">📍 ${h.location.split(',').slice(0,2).join(',')}</span>
            <div class="ahr-meta">
              <span>By ${vendor?.name}</span> · <span>${h.type}</span> · <span>${h.width}×${h.height}ft</span> ·
              <span>${formatCurrency(h.basePriceMonthly)}/mo</span> · <span>${bkCount} bookings</span>
              <a href="${h.gmapsLink||'#'}" target="_blank" class="gmaps-link">📍 Maps</a>
            </div>
          </div>
          <div class="ahr-actions">
            <button onclick="adminEditHoardingModal('${h.id}')" class="umc-btn">✏️ Edit</button>
            <button onclick="adminToggleVerify('${h.id}')" class="umc-btn ${h.verified?'':'umc-green'}">${h.verified?'Revoke':'✅ Verify'}</button>
            <button onclick="adminToggleFeatured('${h.id}')" class="umc-btn umc-amber">${h.featured?'★ Unfeature':'☆ Feature'}</button>
            <button onclick="adminAdjustPriceModal('${h.id}')" class="umc-btn umc-blue">₹ Price</button>
            <button onclick="adminDeleteHoarding('${h.id}')" class="umc-btn umc-red">🗑 Delete</button>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ── Bookings ──────────────────────────────────────────────────
function renderAdminBookings() {
  const bookings=SPYDEE_DATA.bookings;
  return `<div class="admin-section-full">
    <div class="section-header-row"><h3>📋 All Bookings</h3><span class="count-badge">${bookings.length} bookings</span></div>
    <div class="admin-table-wrap">
      <div class="admin-table">
        <div class="at-header at-bookings">
          <span>Booking ID</span><span>Customer</span><span>Hoarding</span>
          <span>Period</span><span>Amount</span><span>Status</span><span>Actions</span>
        </div>
        ${bookings.map(b=>{
          const c=SPYDEE_DATA.users.find(u=>u.id===b.customerId);
          const h=SPYDEE_DATA.hoardings.find(x=>x.id===b.hoardingId);
          return `<div class="at-row at-bookings">
            <span class="mono-text">${b.id}</span>
            <span><strong>${c?.name}</strong><br><small>${c?.email}</small></span>
            <span>${h?.title?.split(' ').slice(0,3).join(' ')||'—'}</span>
            <span>${b.month}×${b.durationMonths||1}mo</span>
            <span>${formatCurrency(b.totalDue)}</span>
            <span><span class="status-badge status-${b.status==='confirmed'?'confirmed':b.status==='cancelled'||b.status==='cancelled-admin'?'cancelled':'hold'}">${b.status}</span></span>
            <span style="display:flex;gap:4px;flex-wrap:wrap">
              <button onclick="adminViewBookingModal('${b.id}')" class="umc-btn umc-blue">👁 View</button>
              <button onclick="adminCancelBooking('${b.id}')" class="umc-btn umc-red" ${b.status!=='confirmed'?'disabled':''}>Cancel</button>
            </span>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;
}

// ── Print Jobs ────────────────────────────────────────────────
function renderAdminPrintJobs() {
  const jobs=SPYDEE_DATA.printJobs;
  return `<div class="admin-section-full">
    <div class="section-header-row"><h3>⚙️ Print Jobs</h3><span class="count-badge">${jobs.length} jobs</span></div>
    <div class="admin-table-wrap">
      <div class="admin-table">
        <div class="at-header at-printjobs">
          <span>Job ID</span><span>Hoarding</span><span>Customer</span>
          <span>Printer</span><span>Material</span><span>Status</span><span>Actions</span>
        </div>
        ${jobs.map(j=>{
          const h=SPYDEE_DATA.hoardings.find(x=>x.id===j.hoardingId);
          const c=SPYDEE_DATA.users.find(u=>u.id===j.customerId);
          const p=SPYDEE_DATA.users.find(u=>u.id===j.printerId);
          return `<div class="at-row at-printjobs">
            <span class="mono-text">${j.id}</span>
            <span>${h?.title?.split(' ').slice(0,2).join(' ')||'—'}</span>
            <span>${c?.name||'—'}</span>
            <span>${p?.name||'<span style="color:var(--text-dim)">Unassigned</span>'}</span>
            <span style="font-size:11px">${j.material?.split(' ').slice(0,2).join(' ')}</span>
            <span><span class="status-badge status-${j.status==='dispatched'?'confirmed':j.status==='in-progress'?'hold':'available'}">${j.status}</span></span>
            <span style="display:flex;gap:4px;flex-wrap:wrap">
              ${!j.printerId?`<button onclick="adminAssignPrinterModal('${j.id}')" class="umc-btn umc-green">Assign</button>`:''}
              ${j.status==='open'?`<button onclick="adminForceAcceptJob('${j.id}')" class="umc-btn umc-amber">Force Accept</button>`:''}
              <button onclick="adminDeletePrintJob('${j.id}')" class="umc-btn umc-red">🗑</button>
            </span>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;
}

// ── Revenue ───────────────────────────────────────────────────
function renderAdminRevenue() {
  const rev=AppState.getRevenueData();
  const total=rev.reduce((s,r)=>s+r.revenue,0);
  const platformShare=Math.round(total*0.05);
  const vendorShare=Math.round(total*0.80);
  return `<div class="admin-section-full">
    <div class="section-header-row"><h3>💰 Revenue Report</h3></div>
    <div class="revenue-summary">
      <div class="rev-card"><div class="rev-val">${formatCurrency(total)}</div><div class="rev-lbl">Total GMV</div></div>
      <div class="rev-card" style="border-color:var(--amber)"><div class="rev-val" style="color:var(--amber)">${formatCurrency(platformShare)}</div><div class="rev-lbl">Platform Fee (5%)</div></div>
      <div class="rev-card" style="border-color:var(--teal)"><div class="rev-val" style="color:var(--teal)">${formatCurrency(vendorShare)}</div><div class="rev-lbl">Vendor Payouts (80%)</div></div>
      <div class="rev-card" style="border-color:var(--purple)"><div class="rev-val" style="color:var(--purple)">${formatCurrency(total-platformShare-vendorShare)}</div><div class="rev-lbl">GST Collected</div></div>
    </div>
    <div class="admin-chart-card">
      <h3>📈 Month-wise GMV Breakdown</h3>
      <div class="rev-table">
        <div class="rt-header"><span>Month</span><span>GMV</span><span>Bookings</span><span>Platform (5%)</span><span>Vendor (80%)</span></div>
        ${rev.map(r=>`<div class="rt-row">
          <span>${r.month}</span>
          <span>${formatCurrency(r.revenue)}</span>
          <span>${r.bookings}</span>
          <span style="color:var(--amber)">${formatCurrency(Math.round(r.revenue*0.05))}</span>
          <span style="color:var(--teal)">${formatCurrency(Math.round(r.revenue*0.80))}</span>
        </div>`).join('')}
      </div>
    </div>
    <div class="panel-box" style="margin-top:16px">
      <h4>🏗 Vendor Earnings Breakdown</h4>
      ${SPYDEE_DATA.users.filter(u=>u.role==='vendor').map(v=>`
      <div class="at-row" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr">
        <span><strong>${v.name}</strong><br><small>${v.company}</small></span>
        <span>${v.inventoryIds?.length||0} boards</span>
        <span>${formatCurrency(v.wallet)} wallet</span>
        <span style="color:var(--teal)">${formatCurrency(v.totalEarnings||0)} earned</span>
        <span><button onclick="adminTopUpModal('${v.id}')" class="umc-btn umc-amber">💳</button></span>
      </div>`).join('')}
    </div>
  </div>`;
}

// ── Admin Modals & Actions ────────────────────────────────────
function adminEditUserModal(userId) {
  const u=SPYDEE_DATA.users.find(x=>x.id===userId);
  if(!u) return;
  const modal=document.getElementById('modal-overlay');
  modal.innerHTML=`<div class="modal-card" style="max-width:480px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>✏️ Edit User — ${u.name}</h3>
    <div class="form-row">
      <div class="form-group"><label>Name</label><input id="eu-name" value="${u.name}"/></div>
      <div class="form-group"><label>Mobile</label><input id="eu-mobile" value="${u.mobile}"/></div>
    </div>
    <div class="form-group"><label>Email</label><input id="eu-email" type="email" value="${u.email}"/></div>
    <div class="form-row">
      <div class="form-group"><label>Company</label><input id="eu-company" value="${u.company||''}"/></div>
      <div class="form-group"><label>GST</label><input id="eu-gst" value="${u.gst||''}"/></div>
    </div>
    <div class="form-group"><label>New Password (leave blank to keep)</label><input type="password" id="eu-pass" placeholder="••••••••"/></div>
    <button onclick="adminSaveUser('${userId}')" class="btn-form-primary">Save Changes</button>
  </div>`;
  modal.classList.add('active');
}

function adminSaveUser(userId) {
  const fields={
    name:document.getElementById('eu-name').value,
    mobile:document.getElementById('eu-mobile').value,
    email:document.getElementById('eu-email').value,
    company:document.getElementById('eu-company').value,
    gst:document.getElementById('eu-gst').value,
  };
  const pass=document.getElementById('eu-pass').value;
  if(pass) fields.password=pass;
  AppState.adminUpdateUser(userId,fields);
  closeModal(); showToast('User updated.','success'); renderDashboard();
}

function adminTopUpModal(userId) {
  const u=SPYDEE_DATA.users.find(x=>x.id===userId);
  const modal=document.getElementById('modal-overlay');
  modal.innerHTML=`<div class="modal-card" style="max-width:360px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>💳 Wallet Top-up — ${u?.name}</h3>
    <p style="color:var(--text-muted);font-size:13px;margin-bottom:12px">Current: <strong style="color:var(--green)">${formatCurrency(u?.wallet||0)}</strong></p>
    <div class="form-group"><label>Amount to Add (₹)</label><input type="number" id="topup-amount" placeholder="50000" min="100"/></div>
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
      ${[10000,25000,50000,100000].map(a=>`<button onclick="document.getElementById('topup-amount').value=${a}" class="btn-xs">${formatCurrency(a)}</button>`).join('')}
    </div>
    <button onclick="adminDoTopUp('${userId}')" class="btn-form-primary">Add to Wallet</button>
  </div>`;
  modal.classList.add('active');
}

function adminDoTopUp(userId) {
  const amount=document.getElementById('topup-amount').value;
  if(!amount||amount<1) return showToast('Enter a valid amount.','error');
  const result=AppState.adminTopUpWallet(userId,amount);
  if(result.ok){ closeModal(); showToast(`✅ ${formatCurrency(amount)} added. New balance: ${formatCurrency(result.newBalance)}`,'success'); renderDashboard(); }
}

function adminVerifyUser(userId) {
  AppState.adminForceVerify(userId); showToast('✅ Vendor verified!','success'); renderDashboard();
}

function adminForceVerifyUser(userId) {
  AppState.adminForceVerify(userId); showToast('✅ OTP forced verified!','success'); renderDashboard();
}

function adminSuspendUser(userId) {
  const result=AppState.adminSuspendUser(userId);
  if(result.ok){ showToast(result.suspended?'⛔ User suspended.':'▶ User unsuspended.', result.suspended?'error':'success'); renderDashboard(); }
}

function adminDeleteUser(userId) {
  const u=SPYDEE_DATA.users.find(x=>x.id===userId);
  if(!confirm(`Delete "${u?.name}"? This cannot be undone.`)) return;
  AppState.adminDeleteUser(userId); showToast('User deleted.','success'); renderDashboard();
}

function adminViewBookings(customerId) {
  const bks=SPYDEE_DATA.bookings.filter(b=>b.customerId===customerId);
  const c=SPYDEE_DATA.users.find(u=>u.id===customerId);
  const modal=document.getElementById('modal-overlay');
  modal.innerHTML=`<div class="modal-card" style="max-width:540px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>📋 Bookings — ${c?.name}</h3>
    ${bks.length===0?'<div class="empty-state">No bookings yet.</div>':
      bks.map(b=>{
        const h=SPYDEE_DATA.hoardings.find(x=>x.id===b.hoardingId);
        return `<div class="payout-card">
          <div class="pc-info"><strong>${h?.title}</strong><span>${b.month} × ${b.durationMonths||1}mo · ${b.status}</span></div>
          <div class="pc-amount"><span class="pc-total">${formatCurrency(b.totalDue)}</span></div>
          <button onclick="adminViewBookingModal('${b.id}')" class="btn-xs-primary">Details</button>
        </div>`;
      }).join('')}
    <button onclick="closeModal()" class="btn-form-primary" style="margin-top:12px">Close</button>
  </div>`;
  modal.classList.add('active');
}

function adminViewBookingModal(bookingId) {
  const b=SPYDEE_DATA.bookings.find(x=>x.id===bookingId);
  const c=SPYDEE_DATA.users.find(u=>u.id===b.customerId);
  const h=SPYDEE_DATA.hoardings.find(x=>x.id===b.hoardingId);
  const modal=document.getElementById('modal-overlay');
  modal.innerHTML=`<div class="modal-card invoice-card">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h2 class="invoice-title">📋 Booking Detail</h2>
    <div class="inv-detail-grid">
      <div class="inv-detail-row"><strong>Booking ID</strong><span class="mono-text">${b.id}</span></div>
      <div class="inv-detail-row"><strong>Customer</strong><span>${c?.name} (${c?.email})</span></div>
      <div class="inv-detail-row"><strong>Mobile</strong><span>${c?.mobile}</span></div>
      <div class="inv-detail-row"><strong>Hoarding</strong><span>${h?.title}</span></div>
      <div class="inv-detail-row"><strong>Period</strong><span>${b.month} × ${b.durationMonths||1} month(s)</span></div>
      <div class="inv-detail-row"><strong>Base Price</strong><span>${formatCurrency(b.basePriceMonthly)}</span></div>
      <div class="inv-detail-row"><strong>GST (18%)</strong><span>${formatCurrency(b.gst)}</span></div>
      <div class="inv-detail-row"><strong>Deposit Paid</strong><span>${formatCurrency(b.depositPaid)}</span></div>
      <div class="inv-detail-row"><strong>Balance Paid</strong><span>${formatCurrency(b.totalDue)}</span></div>
      <div class="inv-detail-row"><strong>Status</strong><span><span class="status-badge status-${b.status==='confirmed'?'confirmed':'hold'}">${b.status}</span></span></div>
      <div class="inv-detail-row"><strong>Created</strong><span>${b.createdAt}</span></div>
      ${b.rating?`<div class="inv-detail-row"><strong>Rating</strong><span>${'★'.repeat(b.rating)} — ${b.review||'No review'}</span></div>`:''}
    </div>
    <div class="form-group" style="margin-top:16px">
      <label>Update Status</label>
      <select id="admin-bk-status">${['confirmed','cancelled','completed','disputed'].map(s=>`<option ${b.status===s?'selected':''}>${s}</option>`).join('')}</select>
    </div>
    <div class="modal-actions">
      <button onclick="adminUpdateBookingStatus('${bookingId}')" class="btn-form-primary">Update Status</button>
      <button onclick="closeModal()" class="btn-ghost">Close</button>
    </div>
  </div>`;
  modal.classList.add('active');
}

function adminUpdateBookingStatus(bookingId) {
  const status=document.getElementById('admin-bk-status').value;
  AppState.adminUpdateBooking(bookingId,{status});
  if(status.includes('cancel')){ const b=SPYDEE_DATA.bookings.find(x=>x.id===bookingId); const h=SPYDEE_DATA.hoardings.find(x=>x.id===b?.hoardingId); if(h) h.status='available'; AppState.save(); }
  closeModal(); showToast('Booking status updated.','success'); renderDashboard();
}

function adminCancelBooking(bookingId) {
  if(!confirm('Cancel this booking? Hoarding will be released.')) return;
  AppState.adminCancelBooking(bookingId); showToast('Booking cancelled.','success'); renderDashboard();
}

function adminEditHoardingModal(hId) {
  const h=SPYDEE_DATA.hoardings.find(x=>x.id===hId);
  const modal=document.getElementById('modal-overlay');
  modal.innerHTML=`<div class="modal-card" style="max-width:500px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>✏️ Edit Hoarding — Admin</h3>
    <div class="form-group"><label>Title</label><input id="ah-title" value="${h.title}"/></div>
    <div class="form-group"><label>Location</label><input id="ah-loc" value="${h.location}"/></div>
    <div class="form-row">
      <div class="form-group"><label>Width (ft)</label><input type="number" id="ah-w" value="${h.width}"/></div>
      <div class="form-group"><label>Height (ft)</label><input type="number" id="ah-h" value="${h.height}"/></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Base Price/mo</label><input type="number" id="ah-price" value="${h.basePriceMonthly}"/></div>
      <div class="form-group"><label>Daily Impressions</label><input type="number" id="ah-imp" value="${h.dailyImpression}"/></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Type</label><select id="ah-type">${['Backlit','Digital LED','Flex'].map(t=>`<option ${h.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="form-group"><label>Traffic</label><select id="ah-traffic">${['Low','Medium','High','Very High'].map(t=>`<option ${h.traffic===t?'selected':''}>${t}</option>`).join('')}</select></div>
    </div>
    <div class="form-group"><label>Google Maps Link</label><input id="ah-gmaps" value="${h.gmapsLink||''}"/></div>
    <button onclick="adminSaveHoarding('${hId}')" class="btn-form-primary">Save Changes</button>
  </div>`;
  modal.classList.add('active');
}

function adminSaveHoarding(hId) {
  AppState.updateInventory(hId,{
    title:document.getElementById('ah-title').value,
    location:document.getElementById('ah-loc').value,
    basePriceMonthly:parseInt(document.getElementById('ah-price').value),
    dailyImpression:parseInt(document.getElementById('ah-imp').value),
    width:parseInt(document.getElementById('ah-w').value),
    height:parseInt(document.getElementById('ah-h').value),
    type:document.getElementById('ah-type').value,
    traffic:document.getElementById('ah-traffic').value,
    gmapsLink:document.getElementById('ah-gmaps').value,
  });
  closeModal(); showToast('✅ Hoarding updated!','success'); renderDashboard();
}

function adminToggleVerify(hId) {
  AppState.toggleHoardingVerify(hId); renderDashboard();
  showToast('Verification status toggled.','success');
}

function adminToggleFeatured(hId) {
  AppState.toggleHoardingFeatured(hId); renderDashboard();
  const h=SPYDEE_DATA.hoardings.find(x=>x.id===hId);
  showToast(h?.featured?'⭐ Marked as featured!':'Featured removed.','success');
}

function adminAdjustPriceModal(hId) {
  const h=SPYDEE_DATA.hoardings.find(x=>x.id===hId);
  const modal=document.getElementById('modal-overlay');
  modal.innerHTML=`<div class="modal-card" style="max-width:360px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>₹ Adjust Pricing</h3>
    <p style="color:var(--text-muted);font-size:13px;margin-bottom:12px">${h.title}<br>Current: <strong>${formatCurrency(h.basePriceMonthly)}/mo</strong></p>
    <div class="form-group"><label>New Base Price (₹/month)</label><input type="number" id="new-price" value="${h.basePriceMonthly}"/></div>
    <button onclick="adminDoAdjustPrice('${hId}')" class="btn-form-primary">Update Price</button>
  </div>`;
  modal.classList.add('active');
}

function adminDoAdjustPrice(hId) {
  const price=document.getElementById('new-price').value;
  AppState.adminAdjustPrice(hId,price); closeModal(); showToast('Price updated!','success'); renderDashboard();
}

function adminDeleteHoarding(hId) {
  const h=SPYDEE_DATA.hoardings.find(x=>x.id===hId);
  if(h?.status==='booked') return showToast('Cannot delete booked hoarding.','error');
  if(!confirm(`Delete "${h?.title}"?`)) return;
  AppState.adminDeleteHoarding(hId); showToast('Hoarding deleted.','success'); renderDashboard();
}

function adminAssignPrinterModal(jobId) {
  const printers=SPYDEE_DATA.users.filter(u=>u.role==='printer');
  const modal=document.getElementById('modal-overlay');
  modal.innerHTML=`<div class="modal-card" style="max-width:380px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>👤 Assign Printer — ${jobId}</h3>
    <div class="form-group"><label>Select Printer</label>
      <select id="assign-printer-select">
        <option value="">Unassigned</option>
        ${printers.map(p=>`<option value="${p.id}">${p.name} (${p.company})</option>`).join('')}
      </select>
    </div>
    <button onclick="adminDoAssignPrinter('${jobId}')" class="btn-form-primary">Assign</button>
  </div>`;
  modal.classList.add('active');
}

function adminDoAssignPrinter(jobId) {
  const printerId=document.getElementById('assign-printer-select').value;
  AppState.adminAssignPrinter(jobId,printerId||null);
  closeModal(); showToast('Printer assigned.','success'); renderDashboard();
}

function adminForceAcceptJob(jobId) {
  const pj=SPYDEE_DATA.printJobs.find(j=>j.id===jobId);
  if(pj){ pj.status='in-progress'; AppState.save(); }
  showToast('Job forced to in-progress.','success'); renderDashboard();
}

function adminDeletePrintJob(jobId) {
  if(!confirm('Delete this print job?')) return;
  SPYDEE_DATA.printJobs=SPYDEE_DATA.printJobs.filter(j=>j.id!==jobId);
  const b=SPYDEE_DATA.bookings.find(x=>x.printJob===jobId);
  if(b) b.printJob=null;
  AppState.save(); showToast('Print job deleted.','success'); renderDashboard();
}

function adminBroadcastModal() {
  const modal=document.getElementById('modal-overlay');
  modal.innerHTML=`<div class="modal-card" style="max-width:440px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>📣 Broadcast Notification</h3>
    <div class="form-group"><label>Target Audience</label>
      <select id="bc-target">
        <option value="all">All Users</option>
        <option value="vendor">Vendors Only</option>
        <option value="customer">Customers Only</option>
        <option value="printer">Printers Only</option>
      </select>
    </div>
    <div class="form-group"><label>Title</label><input id="bc-title" placeholder="System Update"/></div>
    <div class="form-group"><label>Message</label>
      <textarea id="bc-msg" rows="3" style="width:100%;background:var(--bg-surface);border:1px solid var(--border);color:var(--text);padding:10px;border-radius:6px;resize:vertical;font-family:var(--font-body)" placeholder="Enter your message..."></textarea>
    </div>
    <button onclick="adminDoBroadcast()" class="btn-form-primary">Send to All</button>
  </div>`;
  modal.classList.add('active');
}

function adminDoBroadcast() {
  const target=document.getElementById('bc-target').value;
  const title=document.getElementById('bc-title').value;
  const msg=document.getElementById('bc-msg').value;
  if(!title||!msg) return showToast('Fill all fields.','error');
  AppState.broadcastNotification(target,title,msg);
  closeModal(); showToast(`📣 Sent to all ${target} users.`,'success');
}

function adminAddUserModal() {
  const modal=document.getElementById('modal-overlay');
  modal.innerHTML=`<div class="modal-card register-card">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>➕ Add New User</h3>
    <form onsubmit="adminCreateUser(event)">
      <div class="form-group"><label>Role</label>
        <select id="nu-role">
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
          <option value="printer">Printer</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Name *</label><input id="nu-name" required/></div>
        <div class="form-group"><label>Mobile *</label><input id="nu-mobile" required maxlength="10"/></div>
      </div>
      <div class="form-group"><label>Email *</label><input type="email" id="nu-email" required/></div>
      <div class="form-row">
        <div class="form-group"><label>Company</label><input id="nu-company"/></div>
        <div class="form-group"><label>GST</label><input id="nu-gst"/></div>
      </div>
      <div class="form-group"><label>Password *</label><input type="password" id="nu-pass" required/></div>
      <button type="submit" class="btn-form-primary">Create & Auto-Verify</button>
    </form>
  </div>`;
  modal.classList.add('active');
}

function adminCreateUser(e) {
  e.preventDefault();
  const result=AppState.register({
    role:document.getElementById('nu-role').value,
    name:document.getElementById('nu-name').value,
    email:document.getElementById('nu-email').value,
    mobile:document.getElementById('nu-mobile').value,
    company:document.getElementById('nu-company').value,
    gst:document.getElementById('nu-gst').value,
    password:document.getElementById('nu-pass').value
  });
  if(result.ok){
    // Auto-verify since admin is creating
    AppState.adminForceVerify(result.userId);
    closeModal(); showToast('✅ User created and verified.','success'); renderDashboard();
  } else showToast(result.msg,'error');
}

// ============================================================
// SPYDEE v3 — Flex Printer Dashboard
// ============================================================

function renderPrinterView() {
  const printer=AppState.currentUser;
  const printerUser=SPYDEE_DATA.users.find(u=>u.id===printer.id);
  const openJobs=SPYDEE_DATA.printJobs.filter(j=>j.status==='open');
  const myJobs=SPYDEE_DATA.printJobs.filter(j=>j.printerId===printer.id);
  const activeJobs=myJobs.filter(j=>j.status==='in-progress');
  const completedJobs=myJobs.filter(j=>j.status==='dispatched');

  return `<div class="printer-view">
    <div class="vendor-stats-bar">
      <div class="vs-stat" style="border-color:var(--green)"><div class="vs-number" style="color:var(--green)">${openJobs.length}</div><div class="vs-label">Open Jobs</div></div>
      <div class="vs-stat" style="border-color:var(--amber)"><div class="vs-number" style="color:var(--amber)">${activeJobs.length}</div><div class="vs-label">In Progress</div></div>
      <div class="vs-stat" style="border-color:var(--blue)"><div class="vs-number" style="color:var(--blue)">${completedJobs.length}</div><div class="vs-label">Dispatched</div></div>
      <div class="vs-stat wallet-stat"><div class="vs-number">${formatCurrency(printerUser?.wallet||0)}</div><div class="vs-label">Wallet</div></div>
      <div class="vs-stat" style="border-color:var(--teal)"><div class="vs-number" style="color:var(--teal)">${formatCurrency(printerUser?.totalEarnings||0)}</div><div class="vs-label">Total Earned</div></div>
    </div>

    <div class="printer-content">
      <div class="printer-pool-panel">
        <div class="panel-header"><h3>🖨 Open Job Pool</h3><span class="pool-badge">${openJobs.length} available</span></div>
        ${openJobs.length===0
          ?`<div class="empty-state">No open jobs right now.<br>Check back soon!</div>`
          :openJobs.map(j=>renderPrintJobCard(j,'pool')).join('')}
      </div>
      <div class="printer-active-panel">
        <div class="panel-header"><h3>⚙️ My Active Jobs</h3></div>
        ${activeJobs.length===0
          ?`<div class="empty-state">No active jobs.<br>Accept a job from the pool.</div>`
          :activeJobs.map(j=>renderPrintJobCard(j,'active')).join('')}
        <div class="panel-header" style="margin-top:24px"><h3>✅ Completed Jobs</h3></div>
        ${completedJobs.length===0
          ?`<div class="empty-state">No completed jobs yet.</div>`
          :completedJobs.map(j=>renderPrintJobCard(j,'done')).join('')}
      </div>
    </div>
  </div>`;
}

function renderPrintJobCard(job,ctx) {
  const h=SPYDEE_DATA.hoardings.find(x=>x.id===job.hoardingId);
  const customer=SPYDEE_DATA.users.find(u=>u.id===job.customerId);
  const sc={open:'var(--green)','in-progress':'var(--amber)',dispatched:'var(--blue)'};
  return `<div class="print-job-card ${ctx}">
    <div class="pjc-header">
      <div class="pjc-id">
        <span class="job-badge" style="background:${sc[job.status]||'#999'}20;color:${sc[job.status]||'#999'}">${job.status.toUpperCase()}</span>
        <span class="job-id">${job.id}</span>
      </div>
      <div class="pjc-meta">
        <span class="pjc-sla">SLA: ${job.sla}</span>
        <span class="pjc-quote" style="color:var(--amber);font-weight:700">${formatCurrency(job.priceQuote||0)}</span>
      </div>
    </div>
    <div class="pjc-body">
      <div class="pjc-main">
        <h4>${h?.title||job.hoardingId}</h4>
        <p class="pjc-location">📍 ${h?.location?.split(',').slice(0,2).join(',')||'–'}</p>
      </div>
      <div class="pjc-specs">
        <div class="spec-item"><span class="spec-icon">📐</span><div><strong>Dimensions</strong><p>${job.dimensions}</p></div></div>
        <div class="spec-item"><span class="spec-icon">🧵</span><div><strong>Material</strong><p>${job.material}</p></div></div>
        <div class="spec-item"><span class="spec-icon">🎨</span><div><strong>Print Spec</strong><p>${job.printSpec||'—'}</p></div></div>
        <div class="spec-item"><span class="spec-icon">👤</span><div><strong>Client</strong>
        <p>${customer?.name||'–'}${customer?.company?' · '+customer.company:''}</p>
        <!-- FIX #12: printer sees customer contact -->
        ${ctx!=='done'?`<p><a href="tel:${customer?.mobile}" style="color:var(--teal);font-size:11px">📱 ${customer?.mobile||'—'}</a></p>
        <p><a href="mailto:${customer?.email}" style="color:var(--teal);font-size:11px">📧 ${customer?.email||'—'}</a></p>`:''}</div></div>
      <div class="spec-item"><span class="spec-icon">🚚</span><div><strong>Delivery To</strong><p>${job.deliveryAddress||customer?.name||'—'}</p></div></div>
      </div>

      <!-- Artwork with upload/delete -->
      <div class="artwork-section">
        ${job.artworkUrl?`
        <div class="artwork-preview">
          <div class="artwork-header">
            <strong>🎨 Artwork</strong>
            <div style="display:flex;gap:6px">
              <a href="${job.artworkUrl}" download="artwork_${job.id}.png" class="btn-xs-primary">⬇ Download</a>
              ${ctx!=='done'?`<button onclick="handleDeleteArtwork('${job.id}')" class="btn-xs" style="background:var(--red-soft);border-color:var(--red);color:var(--red)">🗑 Remove</button>`:''}
            </div>
          </div>
          <img src="${job.artworkUrl}" style="max-height:80px;border-radius:6px;margin-top:8px;border:1px solid var(--border)"/>
        </div>`
        :ctx!=='done'?`
        <div class="artwork-upload-area">
          <p class="text-muted" style="margin-bottom:6px">📤 No artwork uploaded by client.</p>
          <label class="btn-xs-primary" style="cursor:pointer;display:inline-block">
            Test Upload
            <input type="file" accept="image/*" style="display:none" onchange="attachArtwork(event,'${job.id}')"/>
          </label>
        </div>`:
        `<p class="text-muted" style="font-size:12px">No artwork on file.</p>`}
      </div>

      ${job.trackingNote?`<div class="tracking-note">🚚 ${job.trackingNote}</div>`:''}
    </div>

    <div class="pjc-footer">
      ${ctx==='pool'?`<button onclick="handleAcceptJob('${job.id}')" class="btn-accept-job">✅ Accept Job</button>`
        :ctx==='active'?`<button onclick="showDispatchModal('${job.id}')" class="btn-dispatch-job">🚚 Mark as Dispatched</button>`
        :`<div class="dispatched-status"><span class="dispatched-label">✅ Dispatched ${job.dispatchedAt||''}</span></div>`}
    </div>
  </div>`;
}

function handleAcceptJob(jobId) {
  const result=AppState.acceptPrintJob(jobId);
  if(result.ok){ showToast('✅ Job accepted! Start printing.','success'); renderDashboard(); }
  else showToast('Could not accept.','error');
}

function showDispatchModal(jobId) {
  const modal=document.getElementById('modal-overlay');
  modal.innerHTML=`<div class="modal-card" style="max-width:400px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>🚚 Dispatch Confirmation</h3>
    <div class="form-group"><label>Tracking / Courier Info</label>
      <input id="dispatch-note" placeholder="e.g. Delhivery AWB 12345678 · ETA 2 days"/>
    </div>
    <button onclick="handleDispatchJob('${jobId}')" class="btn-form-primary">Confirm Dispatch</button>
  </div>`;
  modal.classList.add('active');
}

function handleDispatchJob(jobId) {
  const note=document.getElementById('dispatch-note')?.value||'';
  const result=AppState.markPrintJobDispatched(jobId,note);
  if(result.ok){ closeModal(); showToast('🚚 Dispatched!','success'); renderDashboard(); }
  else showToast('Update failed.','error');
}

function attachArtwork(e,jobId) {
  const file=e.target.files[0]; if(!file) return;
  const r=new FileReader();
  r.onload=ev=>{ AppState.updatePrintJobArtwork(jobId,ev.target.result); showToast('🎨 Artwork attached!','success'); renderDashboard(); };
  r.readAsDataURL(file);
}

function handleDeleteArtwork(jobId) {
  if(!confirm('Remove artwork?')) return;
  AppState.deletePrintJobArtwork(jobId); showToast('Artwork removed.','success'); renderDashboard();
}

// ── Admin: Payout Requests Tab ────────────────────────────────
function renderAdminPayouts() {
  const reqs = SPYDEE_DATA.payoutRequests || [];
  return `<div class="admin-section-full">
    <div class="section-header-row">
      <h3>💸 Payout Requests</h3>
      <span class="count-badge">${reqs.filter(r=>r.status==='pending').length} pending</span>
    </div>
    ${reqs.length === 0 ? '<div class="empty-state">No payout requests yet.</div>' :
    `<div class="admin-table-wrap"><div class="admin-table">
      <div class="at-header" style="grid-template-columns:1fr 1fr 1fr 1fr 1fr">
        <span>Vendor</span><span>Amount</span><span>Requested</span><span>Status</span><span>Actions</span>
      </div>
      ${reqs.map(r => {
        const v = SPYDEE_DATA.users.find(u=>u.id===r.vendorId);
        return `<div class="at-row" style="grid-template-columns:1fr 1fr 1fr 1fr 1fr">
          <span><strong>${v?.name}</strong><br><small>${v?.company}</small></span>
          <span style="font-family:var(--font-mono);color:var(--amber);font-weight:700">${formatCurrency(r.amount)}</span>
          <span style="font-size:12px">${new Date(r.ts).toLocaleDateString('en-IN')}</span>
          <span><span class="status-badge status-${r.status==='paid'?'confirmed':r.status==='rejected'?'cancelled':'hold'}">${r.status}</span></span>
          <span style="display:flex;gap:6px">
            ${r.status==='pending' ? `
            <button onclick="adminApprovePayout('${r.id}')" class="umc-btn umc-green">✅ Approve</button>
            <button onclick="adminRejectPayout('${r.id}')" class="umc-btn umc-red">✕ Reject</button>` : '—'}
          </span>
        </div>`;
      }).join('')}
    </div></div>`}
  </div>`;
}
function adminApprovePayout(id) {
  AppState.adminProcessPayout(id, true);
  showToast('✅ Payout approved and processed.', 'success'); renderDashboard();
}
function adminRejectPayout(id) {
  AppState.adminProcessPayout(id, false);
  showToast('Payout rejected.', 'error'); renderDashboard();
}
