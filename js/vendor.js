// ============================================================
// SPYDEE - Vendor (Media Owner) Dashboard View
// ============================================================

function renderVendorView() {
  const vendor = AppState.currentUser;
  const myInventory = SPYDEE_DATA.hoardings.filter(h => h.vendorId === vendor.id);
  const myBookings = SPYDEE_DATA.bookings.filter(b => myInventory.some(h => h.id === b.hoardingId));
  const pendingPayouts = myBookings.filter(b => b.status === 'confirmed');

  return `
  <div class="vendor-view">
    <!-- Vendor Stats Bar -->
    <div class="vendor-stats-bar">
      <div class="vs-stat">
        <div class="vs-number">${myInventory.length}</div>
        <div class="vs-label">Total Boards</div>
      </div>
      <div class="vs-stat">
        <div class="vs-number">${myInventory.filter(h => h.status === 'booked').length}</div>
        <div class="vs-label">Active Bookings</div>
      </div>
      <div class="vs-stat">
        <div class="vs-number">${myInventory.filter(h => h.status === 'on-hold').length}</div>
        <div class="vs-label">On Hold</div>
      </div>
      <div class="vs-stat">
        <div class="vs-number">${formatCurrency(myInventory.filter(h=>h.status==='booked').reduce((s,h)=>s+h.basePriceMonthly,0))}</div>
        <div class="vs-label">Monthly Revenue</div>
      </div>
      <div class="vs-stat wallet-stat">
        <div class="vs-number">${formatCurrency(SPYDEE_DATA.users.find(u=>u.id===vendor.id)?.wallet || 0)}</div>
        <div class="vs-label">Wallet Balance</div>
      </div>
    </div>

    <div class="vendor-content">

      <!-- Left: Inventory Management -->
      <div class="vendor-inventory-panel">
        <div class="panel-header">
          <h3>🏗 My Inventory</h3>
          <button onclick="showAddInventoryModal()" class="btn-primary btn-sm">+ Add Hoarding</button>
        </div>

        <div class="inventory-list">
          ${myInventory.length === 0 
            ? `<div class="empty-state">No inventory yet. Add your first hoarding!</div>`
            : myInventory.map(h => renderVendorHoardingCard(h)).join('')}
        </div>
      </div>

      <!-- Right: Bookings + Logs -->
      <div class="vendor-right-panel">

        <!-- Occupancy Schedule -->
        <div class="panel-box">
          <h4>📅 Occupancy Schedule</h4>
          <div class="schedule-grid">
            <div class="schedule-header">
              <span>Board</span>
              ${['Jul','Aug','Sep','Oct'].map(m => `<span>${m}</span>`).join('')}
            </div>
            ${myInventory.slice(0, 6).map(h => `
            <div class="schedule-row">
              <span class="sch-name">${h.title.split(' ').slice(0,2).join(' ')}</span>
              ${['2025-07','2025-08','2025-09','2025-10'].map(m => {
                const booked = SPYDEE_DATA.bookings.find(b => b.hoardingId === h.id && b.month === m);
                const avail = h.availability[m];
                return `<span class="sch-cell ${booked ? 'sch-booked' : avail ? 'sch-available' : 'sch-blocked'}">
                  ${booked ? '●' : avail ? '○' : '×'}
                </span>`;
              }).join('')}
            </div>`).join('')}
          </div>
          <div class="schedule-legend">
            <span class="leg-booked">● Booked</span>
            <span class="leg-available">○ Available</span>
            <span class="leg-blocked">× Blocked</span>
          </div>
        </div>

        <!-- Pending Checkouts -->
        <div class="panel-box">
          <h4>💰 Pending Balance Checkouts</h4>
          ${pendingPayouts.length === 0 ? '<p class="text-muted">No pending payouts.</p>' : 
            pendingPayouts.map(b => {
              const h = SPYDEE_DATA.hoardings.find(x => x.id === b.hoardingId);
              const cust = SPYDEE_DATA.users.find(u => u.id === b.customerId);
              return `
              <div class="payout-card">
                <div class="pc-info">
                  <strong>${h?.title}</strong>
                  <span>${cust?.name} · ${b.month}</span>
                </div>
                <div class="pc-amount">
                  <span class="pc-total">${formatCurrency(b.basePriceMonthly)}</span>
                  <span class="pc-gst">+GST ${formatCurrency(b.gst)}</span>
                </div>
                ${!b.proofOfPerf ? `
                <div class="proof-alert">
                  📸 Upload Proof of Performance
                  <button onclick="triggerProofUpload('${b.id}')" class="btn-xs-primary">Upload Photo</button>
                </div>` : `<span class="proof-done">✓ Proof Submitted</span>`}
              </div>`;
            }).join('')}
        </div>

        <!-- Validation Logs -->
        <div class="panel-box">
          <h4>📋 Validation Log</h4>
          <div class="validation-log">
            ${myInventory.map(h => `
            <div class="log-entry">
              <span class="log-time">${new Date().toLocaleDateString('en-IN')}</span>
              <span class="log-status ${h.verified ? 'log-ok' : 'log-pending'}">${h.verified ? '✓' : '⏳'}</span>
              <span class="log-msg">${h.title} — ${h.verified ? 'Verified by Admin' : 'Pending Admin Verification'}</span>
            </div>`).join('')}
          </div>
        </div>

      </div>
    </div>
  </div>`;
}

function renderVendorHoardingCard(h) {
  const statusColor = h.status === 'booked' ? '#e74c3c' : h.status === 'on-hold' ? '#f39c12' : '#2ecc71';
  return `
  <div class="inv-card" id="inv-${h.id}">
    <div class="inv-billboard">
      <div class="inv-bb-face ${h.type === 'Digital LED' ? 'bb-digital' : h.type === 'Backlit' ? 'bb-backlit' : 'bb-flex'}">
        ${h.width}×${h.height}ft
      </div>
    </div>
    <div class="inv-info">
      <div class="inv-title-row">
        <strong>${h.title}</strong>
        <span class="inv-status" style="background:${statusColor}20;color:${statusColor}">${h.status}</span>
      </div>
      <p class="inv-loc">📍 ${h.location.split(',')[0]}</p>
      <div class="inv-meta">
        <span>${h.type}</span> · <span>${h.orientation}</span> · <span>${formatCurrency(h.basePriceMonthly)}/mo</span>
      </div>
      <div class="inv-tags">
        <span class="spec-tag">${h.material}</span>
        <span class="spec-tag ${h.verified ? 'tag-verified' : 'tag-pending'}">${h.verified ? '✓ Verified' : '⏳ Pending'}</span>
      </div>
    </div>
    <div class="inv-actions">
      <button onclick="showEditInventoryModal('${h.id}')" class="btn-icon" title="Edit">✏️</button>
      <button onclick="showInventoryAvailModal('${h.id}')" class="btn-icon" title="Availability">📅</button>
      <button onclick="handleDeleteInventory('${h.id}')" class="btn-icon btn-icon-danger" title="Delete">🗑</button>
    </div>
  </div>`;
}

// ── Add/Edit Inventory Modal ───────────────────────────────────
function showAddInventoryModal(editId = null) {
  const h = editId ? SPYDEE_DATA.hoardings.find(x => x.id === editId) : null;
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `
  <div class="modal-card inventory-modal">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h2>${h ? '✏️ Edit Hoarding' : '+ Add New Hoarding'}</h2>
    <form onsubmit="${h ? `handleUpdateInventory(event,'${editId}')` : 'handleAddInventory(event)'}">
      <div class="form-row">
        <div class="form-group" style="flex:2">
          <label>Board Title *</label>
          <input type="text" id="inv-title" required value="${h?.title || ''}" placeholder="e.g. Wakad Junction Mega Backlit" />
        </div>
        <div class="form-group">
          <label>Type *</label>
          <select id="inv-type" required>
            ${['Backlit','Digital LED','Flex'].map(t => `<option ${h?.type===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Location Address *</label>
        <input type="text" id="inv-location" required value="${h?.location || ''}" placeholder="Near D-Mart, Wakad Chowk, Pune - 411057" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Latitude</label>
          <input type="number" id="inv-lat" step="0.0001" value="${h?.lat || 18.5642}" />
        </div>
        <div class="form-group">
          <label>Longitude</label>
          <input type="number" id="inv-lng" step="0.0001" value="${h?.lng || 73.8482}" />
        </div>
      </div>
      <div class="form-group">
        <label>Google Maps Link</label>
        <input type="url" id="inv-gmaps" value="${h?.gmapsLink || ''}" placeholder="https://maps.google.com/?q=18.5986,73.7611" />
        <small class="hint">Paste the Google Maps share link for your hoarding location</small>
      </div>
      <div class="form-group">
        <label>Hoarding Position Preview (Red Square)</label>
        <div class="red-square-editor" id="rs-editor">
          <div class="rs-backdrop">
            <div class="rs-overlay" id="rs-overlay"
                 style="left:${h?.redSquare?.x||100}px;top:${h?.redSquare?.y||80}px;width:${h?.redSquare?.w||400}px;height:${h?.redSquare?.h||180}px"
                 title="Drag to reposition">
              <div class="rs-handle rs-tl"></div>
              <div class="rs-handle rs-tr"></div>
              <div class="rs-handle rs-bl"></div>
              <div class="rs-handle rs-br"></div>
            </div>
          </div>
          <p class="hint">This red square marks the hoarding position on the street image. Drag to adjust.</p>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Width (ft) *</label>
          <input type="number" id="inv-width" required value="${h?.width || 30}" />
        </div>
        <div class="form-group">
          <label>Height (ft) *</label>
          <input type="number" id="inv-height" required value="${h?.height || 15}" />
        </div>
        <div class="form-group">
          <label>Orientation *</label>
          <select id="inv-orientation">
            <option ${h?.orientation==='LHS'?'selected':''}>LHS</option>
            <option ${h?.orientation==='RHS'?'selected':''}>RHS</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Base Price/Month (₹) *</label>
          <input type="number" id="inv-price" required value="${h?.basePriceMonthly || 50000}" />
        </div>
        <div class="form-group">
          <label>Daily Impressions</label>
          <input type="number" id="inv-impressions" value="${h?.dailyImpression || 15000}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Material</label>
          <input type="text" id="inv-material" value="${h?.material || 'Star Flex 440 GSM'}" />
        </div>
        <div class="form-group">
          <label>Illumination</label>
          <input type="text" id="inv-illumination" value="${h?.illumination || 'LED Backlit 6000K'}" />
        </div>
      </div>
      <div class="form-group">
        <label>Print Specification</label>
        <input type="text" id="inv-printspec" value="${h?.printSpec || '6x4 Solvent Print, 1440 DPI'}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Traffic Level</label>
          <select id="inv-traffic">
            ${['Low','Medium','High','Very High'].map(t => `<option ${h?.traffic===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="modal-actions">
        <button type="submit" class="btn-form-primary">${h ? 'Save Changes' : 'Add to Inventory'}</button>
        <button type="button" onclick="closeModal()" class="btn-ghost">Cancel</button>
      </div>
    </form>
  </div>`;
  modal.classList.add('active');
  initRedSquareDrag();
}

function showEditInventoryModal(id) {
  showAddInventoryModal(id);
}

function handleAddInventory(e) {
  e.preventDefault();
  const result = AppState.addInventory(gatherInventoryForm());
  if (result.ok) {
    closeModal();
    showToast('✅ Hoarding added! Pending admin verification.', 'success');
    renderDashboard();
  } else {
    showToast('Failed to add inventory.', 'error');
  }
}

function handleUpdateInventory(e, id) {
  e.preventDefault();
  const result = AppState.updateInventory(id, gatherInventoryForm());
  if (result.ok) {
    closeModal();
    showToast('✅ Hoarding updated!', 'success');
    renderDashboard();
  } else {
    showToast('Failed to update.', 'error');
  }
}

function gatherInventoryForm() {
  return {
    title: document.getElementById('inv-title').value,
    type: document.getElementById('inv-type').value,
    location: document.getElementById('inv-location').value,
    lat: parseFloat(document.getElementById('inv-lat').value),
    lng: parseFloat(document.getElementById('inv-lng').value),
    gmapsLink: document.getElementById('inv-gmaps').value,
    width: document.getElementById('inv-width').value,
    height: document.getElementById('inv-height').value,
    orientation: document.getElementById('inv-orientation').value,
    basePriceMonthly: document.getElementById('inv-price').value,
    dailyImpression: document.getElementById('inv-impressions').value,
    material: document.getElementById('inv-material').value,
    illumination: document.getElementById('inv-illumination').value,
    printSpec: document.getElementById('inv-printspec').value,
    traffic: document.getElementById('inv-traffic').value,
    redSquare: AppState._currentRedSquare || { x: 100, y: 80, w: 400, h: 180 }
  };
}

function handleDeleteInventory(id) {
  if (!confirm('Delete this hoarding from inventory?')) return;
  const result = AppState.deleteInventory(id);
  if (result.ok) {
    showToast('Hoarding removed.', 'success');
    renderDashboard();
  } else {
    showToast('Cannot delete. You may not own this board.', 'error');
  }
}

function showInventoryAvailModal(id) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === id);
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `
  <div class="modal-card" style="max-width:440px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>📅 Availability — ${h.title}</h3>
    <div class="avail-grid">
      ${['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12'].map(m => `
      <label class="avail-toggle">
        <input type="checkbox" ${h.availability[m] ? 'checked' : ''}
               onchange="toggleMonthAvail('${id}','${m}',this.checked)" />
        <span class="avail-month">${m}</span>
        <span class="avail-status">${h.availability[m] ? '✓ Open' : '✕ Blocked'}</span>
      </label>`).join('')}
    </div>
    <p class="hint">Toggle months to mark as available or blocked for bookings.</p>
    <button onclick="closeModal()" class="btn-form-primary">Done</button>
  </div>`;
  modal.classList.add('active');
}

function toggleMonthAvail(hId, month, val) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
  if (h) { h.availability[month] = val; AppState.save(); }
}

function triggerProofUpload(bookingId) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const booking = SPYDEE_DATA.bookings.find(b => b.id === bookingId);
      if (booking) { booking.proofOfPerf = ev.target.result; AppState.save(); }
      showToast('📸 Proof of Performance uploaded!', 'success');
      renderDashboard();
    };
    reader.readAsDataURL(file);
  };
  inp.click();
}

// ── Red Square Drag Init ───────────────────────────────────────
function initRedSquareDrag() {
  setTimeout(() => {
    const overlay = document.getElementById('rs-overlay');
    if (!overlay) return;
    let dragging = false, startX, startY, origL, origT;
    overlay.addEventListener('mousedown', (e) => {
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      origL = parseInt(overlay.style.left); origT = parseInt(overlay.style.top);
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      overlay.style.left = Math.max(0, origL + dx) + 'px';
      overlay.style.top = Math.max(0, origT + dy) + 'px';
      AppState._currentRedSquare = {
        x: parseInt(overlay.style.left), y: parseInt(overlay.style.top),
        w: parseInt(overlay.style.width), h: parseInt(overlay.style.height)
      };
    });
    document.addEventListener('mouseup', () => { dragging = false; });
  }, 100);
}
