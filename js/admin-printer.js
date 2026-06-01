// ============================================================
// SPYDEE - Flex Printer Dashboard View
// ============================================================

function renderPrinterView() {
  const printer = AppState.currentUser;
  const openJobs = SPYDEE_DATA.printJobs.filter(j => j.status === 'open');
  const myJobs = SPYDEE_DATA.printJobs.filter(j => j.printerId === printer.id);
  const completedJobs = myJobs.filter(j => j.status === 'dispatched');
  const activeJobs = myJobs.filter(j => j.status === 'in-progress');

  return `
  <div class="printer-view">
    <!-- Stats -->
    <div class="vendor-stats-bar">
      <div class="vs-stat">
        <div class="vs-number">${openJobs.length}</div>
        <div class="vs-label">Open Jobs</div>
      </div>
      <div class="vs-stat">
        <div class="vs-number">${activeJobs.length}</div>
        <div class="vs-label">In Progress</div>
      </div>
      <div class="vs-stat">
        <div class="vs-number">${completedJobs.length}</div>
        <div class="vs-label">Dispatched</div>
      </div>
      <div class="vs-stat wallet-stat">
        <div class="vs-number">${formatCurrency(SPYDEE_DATA.users.find(u=>u.id===printer.id)?.wallet||0)}</div>
        <div class="vs-label">Wallet</div>
      </div>
    </div>

    <div class="printer-content">

      <!-- Open Job Pool -->
      <div class="printer-pool-panel">
        <div class="panel-header">
          <h3>🖨 Open Job Pool</h3>
          <span class="pool-badge">${openJobs.length} available</span>
        </div>

        ${openJobs.length === 0 
          ? `<div class="empty-state">No open print jobs right now. Check back soon!</div>`
          : openJobs.map(job => renderPrintJobCard(job, 'pool')).join('')}
      </div>

      <!-- My Active Jobs -->
      <div class="printer-active-panel">
        <div class="panel-header">
          <h3>⚙️ My Active Jobs</h3>
        </div>
        ${activeJobs.length === 0
          ? `<div class="empty-state">Accept a job from the pool to get started.</div>`
          : activeJobs.map(job => renderPrintJobCard(job, 'active')).join('')}

        <div class="panel-header" style="margin-top:24px">
          <h3>✅ Completed Jobs</h3>
        </div>
        ${completedJobs.length === 0
          ? `<div class="empty-state">No completed jobs yet.</div>`
          : completedJobs.map(job => renderPrintJobCard(job, 'done')).join('')}
      </div>

    </div>
  </div>`;
}

function renderPrintJobCard(job, context) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === job.hoardingId);
  const booking = SPYDEE_DATA.bookings.find(b => b.id === job.bookingId);
  const customer = SPYDEE_DATA.users.find(u => u.id === job.customerId);

  const statusColors = {
    open: '#2ecc71', 'in-progress': '#f39c12', dispatched: '#3498db'
  };

  return `
  <div class="print-job-card ${context}">
    <div class="pjc-header">
      <div class="pjc-id">
        <span class="job-badge" style="background:${statusColors[job.status] || '#999'}20;color:${statusColors[job.status] || '#999'}">
          ${job.status.toUpperCase()}
        </span>
        <span class="job-id">${job.id}</span>
      </div>
      <div class="pjc-sla">SLA: ${job.sla}</div>
    </div>

    <div class="pjc-body">
      <div class="pjc-main">
        <h4>${h?.title || job.hoardingId}</h4>
        <p class="pjc-location">📍 ${h?.location?.split(',').slice(0,2).join(',') || '–'}</p>
      </div>

      <div class="pjc-specs">
        <div class="spec-item">
          <span class="spec-icon">📐</span>
          <div>
            <strong>Dimensions</strong>
            <p>${job.dimensions}</p>
          </div>
        </div>
        <div class="spec-item">
          <span class="spec-icon">🧵</span>
          <div>
            <strong>Material</strong>
            <p>${job.material}</p>
          </div>
        </div>
        <div class="spec-item">
          <span class="spec-icon">🎨</span>
          <div>
            <strong>Print Spec</strong>
            <p>${job.printSpec || h?.printSpec || '6x4 Solvent, 1440 DPI'}</p>
          </div>
        </div>
        <div class="spec-item">
          <span class="spec-icon">👤</span>
          <div>
            <strong>Client</strong>
            <p>${customer?.name || '–'} ${customer?.company ? '(' + customer.company + ')' : ''}</p>
          </div>
        </div>
      </div>

      ${job.artworkUrl ? `
      <div class="artwork-preview">
        <strong>🎨 Artwork:</strong>
        <img src="${job.artworkUrl}" alt="Artwork" />
        <a href="${job.artworkUrl}" download="artwork_${job.id}.png" class="btn-xs-primary">⬇ Download</a>
      </div>` : `
      <div class="artwork-upload-area">
        ${context === 'active' ? `
        <p class="text-muted">📤 Client artwork not uploaded yet.</p>
        <label class="btn-xs-primary" style="cursor:pointer">
          Upload Test Artwork
          <input type="file" accept="image/*" style="display:none" onchange="attachArtwork(event,'${job.id}')" />
        </label>` : `<p class="text-muted">Awaiting client artwork upload.</p>`}
      </div>`}
    </div>

    <div class="pjc-footer">
      ${context === 'pool' ? `
        <button onclick="handleAcceptJob('${job.id}')" class="btn-accept-job">
          ✅ Accept Job
        </button>
      ` : context === 'active' ? `
        <div class="sla-progress">
          <span>Job accepted. Print & dispatch within ${job.sla}.</span>
        </div>
        <button onclick="handleDispatchJob('${job.id}')" class="btn-dispatch-job">
          🚚 Mark as Dispatched
        </button>
      ` : `
        <div class="dispatched-status">
          <span class="dispatched-label">✅ Dispatched on ${new Date().toLocaleDateString('en-IN')}</span>
        </div>
      `}
    </div>
  </div>`;
}

function handleAcceptJob(jobId) {
  const result = AppState.acceptPrintJob(jobId);
  if (result.ok) {
    showToast('✅ Job accepted! Start printing.', 'success');
    renderDashboard();
  } else {
    showToast('Could not accept job.', 'error');
  }
}

function handleDispatchJob(jobId) {
  const result = AppState.markPrintJobDispatched(jobId);
  if (result.ok) {
    showToast('🚚 Marked as dispatched!', 'success');
    renderDashboard();
  } else {
    showToast('Could not update job.', 'error');
  }
}

function attachArtwork(e, jobId) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const pj = SPYDEE_DATA.printJobs.find(j => j.id === jobId);
    if (pj) { pj.artworkUrl = ev.target.result; AppState.save(); }
    showToast('🎨 Artwork attached!', 'success');
    renderDashboard();
  };
  reader.readAsDataURL(file);
}


// ============================================================
// SPYDEE - Super Admin Dashboard View
// ============================================================

function renderAdminView() {
  const vendors = SPYDEE_DATA.users.filter(u => u.role === 'vendor');
  const customers = SPYDEE_DATA.users.filter(u => u.role === 'customer');
  const printers = SPYDEE_DATA.users.filter(u => u.role === 'printer');
  const totalRevenue = SPYDEE_DATA.bookings.reduce((s, b) => s + b.basePriceMonthly, 0);

  return `
  <div class="admin-view">
    <!-- Platform Stats -->
    <div class="admin-stats-grid">
      <div class="admin-stat-card">
        <div class="asc-icon">📊</div>
        <div class="asc-value">${SPYDEE_DATA.hoardings.length}</div>
        <div class="asc-label">Total Hoardings</div>
      </div>
      <div class="admin-stat-card">
        <div class="asc-icon">🏗</div>
        <div class="asc-value">${vendors.length}</div>
        <div class="asc-label">Vendors</div>
      </div>
      <div class="admin-stat-card">
        <div class="asc-icon">📢</div>
        <div class="asc-value">${customers.length}</div>
        <div class="asc-label">Advertisers</div>
      </div>
      <div class="admin-stat-card">
        <div class="asc-icon">🖨</div>
        <div class="asc-value">${printers.length}</div>
        <div class="asc-label">Printers</div>
      </div>
      <div class="admin-stat-card highlight">
        <div class="asc-icon">💰</div>
        <div class="asc-value">${formatCurrency(totalRevenue)}</div>
        <div class="asc-label">Total GMV</div>
      </div>
      <div class="admin-stat-card">
        <div class="asc-icon">📋</div>
        <div class="asc-value">${SPYDEE_DATA.bookings.length}</div>
        <div class="asc-label">Bookings</div>
      </div>
    </div>

    <div class="admin-content">

      <!-- Vendor Management -->
      <div class="admin-section">
        <h3>🏗 Vendor Management</h3>
        <div class="admin-table">
          <div class="at-header">
            <span>Name</span><span>Company</span><span>GST</span>
            <span>Boards</span><span>Status</span><span>Actions</span>
          </div>
          ${vendors.map(v => `
          <div class="at-row">
            <span>
              <strong>${v.name}</strong><br>
              <small>${v.email} · ${v.mobile}</small>
            </span>
            <span>${v.company}</span>
            <span class="gst-code">${v.gst || '—'}</span>
            <span>${v.inventoryIds?.length || 0}</span>
            <span>
              <span class="status-badge ${v.verified ? 'status-confirmed' : 'status-hold'}">
                ${v.verified ? 'Verified' : 'Pending'}
              </span>
            </span>
            <span>
              ${!v.verified ? `<button onclick="handleVerifyVendor('${v.id}')" class="btn-xs-primary">Verify</button>` : '✓'}
            </span>
          </div>`).join('')}
        </div>
      </div>

      <!-- Customer Management -->
      <div class="admin-section">
        <h3>📢 Customer Tracking</h3>
        <div class="admin-table">
          <div class="at-header">
            <span>Name</span><span>Email</span><span>Mobile</span>
            <span>Wallet</span><span>Bookings</span><span>Status</span>
          </div>
          ${customers.map(c => `
          <div class="at-row">
            <span><strong>${c.name}</strong></span>
            <span>${c.email}</span>
            <span>${c.mobile}</span>
            <span>${formatCurrency(SPYDEE_DATA.users.find(u=>u.id===c.id)?.wallet||0)}</span>
            <span>${c.bookings?.length || 0}</span>
            <span>
              <span class="status-badge ${c.otpVerified ? 'status-confirmed' : 'status-hold'}">
                ${c.otpVerified ? 'Active' : 'Unverified'}
              </span>
            </span>
          </div>`).join('')}
        </div>
      </div>

      <!-- Hoarding Verification -->
      <div class="admin-section">
        <h3>✅ Inventory Verification Queue</h3>
        <div class="verify-queue">
          ${SPYDEE_DATA.hoardings.map(h => {
            const vendor = SPYDEE_DATA.users.find(u => u.id === h.vendorId);
            return `
            <div class="vq-row">
              <div class="vq-info">
                <strong>${h.title}</strong>
                <span>by ${vendor?.name} · ${h.type} · ${h.width}×${h.height}ft · ${formatCurrency(h.basePriceMonthly)}/mo</span>
                <a href="${h.gmapsLink}" target="_blank" class="gmaps-link">📍 View on Maps</a>
              </div>
              <div class="vq-status">
                <span class="status-badge ${h.verified ? 'status-confirmed' : 'status-hold'}">
                  ${h.verified ? 'Verified' : 'Pending'}
                </span>
                <button onclick="handleAdminVerifyHoarding('${h.id}')" class="btn-xs ${h.verified ? '' : 'btn-xs-primary'}">
                  ${h.verified ? 'Revoke' : 'Approve'}
                </button>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Print Jobs Overview -->
      <div class="admin-section">
        <h3>🖨 All Print Jobs</h3>
        <div class="admin-table">
          <div class="at-header">
            <span>Job ID</span><span>Hoarding</span><span>Customer</span>
            <span>Printer</span><span>Status</span><span>Created</span>
          </div>
          ${SPYDEE_DATA.printJobs.map(pj => {
            const h = SPYDEE_DATA.hoardings.find(x => x.id === pj.hoardingId);
            const cust = SPYDEE_DATA.users.find(u => u.id === pj.customerId);
            const prntr = SPYDEE_DATA.users.find(u => u.id === pj.printerId);
            return `
            <div class="at-row">
              <span class="job-id">${pj.id}</span>
              <span>${h?.title?.split(' ').slice(0,3).join(' ') || '–'}</span>
              <span>${cust?.name || '–'}</span>
              <span>${prntr?.name || 'Unassigned'}</span>
              <span><span class="status-badge status-${pj.status === 'dispatched' ? 'confirmed' : pj.status === 'in-progress' ? 'hold' : 'available'}">${pj.status}</span></span>
              <span>${pj.createdAt}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

    </div>
  </div>`;
}

function handleVerifyVendor(vendorId) {
  AppState.verifyVendor(vendorId);
  showToast('✅ Vendor verified!', 'success');
  renderDashboard();
}

function handleAdminVerifyHoarding(hId) {
  AppState.toggleHoardingVerify(hId);
  renderDashboard();
}
