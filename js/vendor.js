// ============================================================
// SPYDEE v3 — Vendor Dashboard
// Photo-first inventory: upload street photo → draw red box on it
// ============================================================

function renderVendorView() {
  const vendor = AppState.currentUser;
  const myInventory = SPYDEE_DATA.hoardings.filter(h => h.vendorId === vendor.id);
  const myBookings = SPYDEE_DATA.bookings.filter(b =>
    myInventory.some(h => h.id === b.hoardingId) && b.status === 'confirmed');
  const walletUser = SPYDEE_DATA.users.find(u => u.id === vendor.id);
  const totalRevenue = myInventory.filter(h => h.status === 'booked').reduce((s, h) => s + h.basePriceMonthly, 0);

  return `<div class="vendor-view">
    <!-- Stats Bar -->
    <div class="vendor-stats-bar">
      <div class="vs-stat"><div class="vs-number">${myInventory.length}</div><div class="vs-label">Total Boards</div></div>
      <div class="vs-stat" style="border-color:var(--red)"><div class="vs-number" style="color:var(--red)">${myInventory.filter(h=>h.status==='booked').length}</div><div class="vs-label">Booked</div></div>
      <div class="vs-stat" style="border-color:var(--amber)"><div class="vs-number" style="color:var(--amber)">${myInventory.filter(h=>h.status==='on-hold').length}</div><div class="vs-label">On Hold</div></div>
      <div class="vs-stat" style="border-color:var(--green)"><div class="vs-number" style="color:var(--green)">${myInventory.filter(h=>h.status==='available').length}</div><div class="vs-label">Available</div></div>
      <div class="vs-stat"><div class="vs-number">${formatCurrency(totalRevenue)}</div><div class="vs-label">Monthly Rev.</div></div>
      <div class="vs-stat wallet-stat"><div class="vs-number">${formatCurrency(walletUser?.wallet||0)}</div><div class="vs-label">Wallet</div></div>
      <div class="vs-stat" style="border-color:var(--teal)"><div class="vs-number" style="color:var(--teal)">${formatCurrency(walletUser?.totalEarnings||0)}</div><div class="vs-label">Total Earned</div></div>
    </div>

    <div class="vendor-content">
      <!-- LEFT: Inventory List -->
      <div class="vendor-inventory-panel">
        <div class="panel-header">
          <h3>🏗 My Inventory</h3>
          <button onclick="showAddInventoryModal()" class="btn-primary btn-sm">+ Add Hoarding</button>
        </div>
        <div class="inventory-list">
          ${myInventory.length === 0
            ? `<div class="empty-state">No inventory yet.<br><br>
               <button onclick="showAddInventoryModal()" class="btn-primary">+ Add Your First Hoarding</button></div>`
            : myInventory.map(h => renderVendorHoardingCard(h)).join('')}
        </div>
      </div>

      <!-- RIGHT: Schedule + Payouts -->
      <div class="vendor-right-panel">
        <!-- Occupancy Schedule -->
        <div class="panel-box">
          <h4>📅 Occupancy Schedule</h4>
          ${myInventory.length === 0 ? `<p class="text-muted" style="font-size:13px">Add hoardings to see schedule.</p>` : `
          <div class="schedule-grid">
            <div class="schedule-header">
              <span>Board</span>
              ${['Jul','Aug','Sep','Oct','Nov','Dec'].map(m=>`<span>${m}</span>`).join('')}
            </div>
            ${myInventory.slice(0,8).map(h => `
            <div class="schedule-row">
              <span class="sch-name" title="${h.title}">${h.title.split(' ').slice(0,2).join(' ')}</span>
              ${['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12'].map(m => {
                const booked = SPYDEE_DATA.bookings.find(b => b.hoardingId===h.id && b.month===m && b.status==='confirmed');
                const avail = h.availability?.[m];
                const cls = booked ? 'sch-booked' : avail ? 'sch-available' : 'sch-blocked';
                return `<span class="sch-cell ${cls}" title="${m}: ${booked?'Booked':avail?'Available':'Blocked'}">${booked?'●':avail?'○':'×'}</span>`;
              }).join('')}
            </div>`).join('')}
          </div>
          <div class="schedule-legend">
            <span class="leg-booked">● Booked</span>
            <span class="leg-available">○ Available</span>
            <span class="leg-blocked">× Blocked</span>
          </div>`}
        </div>

        <!-- Active Bookings & Proof -->
        <div class="panel-box">
          <h4>💰 Active Bookings & Proof of Performance</h4>
          ${myBookings.length === 0
            ? `<p class="text-muted" style="font-size:13px">No active bookings right now.</p>`
            : myBookings.map(b => {
                const h = SPYDEE_DATA.hoardings.find(x => x.id === b.hoardingId);
                const cust = SPYDEE_DATA.users.find(u => u.id === b.customerId);
                return `<div class="payout-card">
                  <div class="pc-info">
                    <strong>${h?.title}</strong>
                    <span>${cust?.name}${cust?.company ? ' · ' + cust.company : ''} · ${b.month}</span>
                  </div>
                  <div class="pc-amount">
                    <span class="pc-total">${formatCurrency(b.basePriceMonthly)}</span>
                    <span class="pc-gst">+GST ${formatCurrency(b.gst)}</span>
                  </div>
                  ${!b.proofOfPerf
                    ? `<div class="proof-alert">📸 Upload site photo as proof
                        <button onclick="triggerProofUpload('${b.id}')" class="btn-xs-primary">Upload Photo</button>
                       </div>`
                    : `<div class="proof-done">✓ Proof Submitted
                        <button onclick="viewProofImage('${b.id}')" class="btn-xs">👁 View</button>
                        <button onclick="deleteProofImage('${b.id}')" class="btn-xs" style="color:var(--red)">🗑</button>
                       </div>`}
                </div>`;
              }).join('')}
        </div>

        <!-- Validation Log -->
        <div class="panel-box">
          <h4>📋 Verification Status</h4>
          ${myInventory.length === 0
            ? `<p class="text-muted" style="font-size:13px">Nothing to show.</p>`
            : `<div class="validation-log">
              ${myInventory.map(h => `
              <div class="log-entry">
                <span class="log-status ${h.verified?'log-ok':'log-pending'}">${h.verified?'✓':'⏳'}</span>
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h.title}</div>
                  <div style="font-size:11px;color:var(--text-muted)">${h.verified ? '✅ Admin Verified · Visible to customers' : '⏳ Pending admin review'}</div>
                </div>
                <span class="inv-status" style="background:${h.status==='available'?'var(--green-soft)':h.status==='booked'?'var(--red-soft)':'var(--amber-soft)'};color:${h.status==='available'?'var(--green)':h.status==='booked'?'var(--red)':'var(--amber)'};flex-shrink:0">${h.status}</span>
              </div>`).join('')}
            </div>`}
        </div>
      </div>
    </div>
  </div>`;
}

// ── Vendor Hoarding Card ──────────────────────────────────────
function renderVendorHoardingCard(h) {
  const sc = { available: 'var(--green)', 'on-hold': 'var(--amber)', booked: 'var(--red)' };
  const color = sc[h.status] || '#999';
  const coverPhoto = h.images?.[0];
  return `<div class="inv-card">
    <div class="inv-cover">
      ${coverPhoto
        ? `<img src="${coverPhoto}" class="inv-cover-img" alt="${h.title}"/>`
        : `<div class="inv-cover-placeholder">
             <div class="bb-face ${h.type==='Digital LED'?'bb-digital':h.type==='Backlit'?'bb-backlit':'bb-flex'}"
                  style="width:64px;height:32px;display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--text-muted)">
               ${h.width}×${h.height}ft
             </div>
             <div style="font-size:10px;color:var(--text-dim);margin-top:4px">No photo yet</div>
           </div>`}
      <span class="inv-status-badge" style="background:${color}20;color:${color};border-color:${color}40">${h.status}</span>
      ${!coverPhoto ? `<div class="inv-no-photo-warn">📷 Add photo</div>` : ''}
    </div>
    <div class="inv-info">
      <div class="inv-title-row">
        <strong class="inv-title-text">${h.title}</strong>
      </div>
      <p class="inv-loc">📍 ${h.location.split(',')[0]}</p>
      <div class="inv-meta-row">
        <span>${h.type}</span>
        <span>${h.width}×${h.height}ft</span>
        <span>${formatCurrency(h.basePriceMonthly)}/mo</span>
      </div>
      <div class="inv-tags">
        <span class="spec-tag ${h.verified?'tag-verified':'tag-pending'}">${h.verified?'✓ Verified':'⏳ Pending'}</span>
        ${h.images?.length ? `<span class="spec-tag" style="color:var(--teal)">📷 ${h.images.length}</span>` : '<span class="spec-tag" style="color:var(--red)">No photo</span>'}
        ${h.featured ? `<span class="spec-tag" style="color:var(--amber)">⭐ Featured</span>` : ''}
      </div>
    </div>
    <div class="inv-actions">
      <button onclick="showEditInventoryModal('${h.id}')" class="btn-icon" title="Edit Details">✏️</button>
      <button onclick="showPhotoEditor('${h.id}')" class="btn-icon ${!h.images?.length ? 'btn-icon-urgent' : ''}" title="Manage Photos & Mark Hoarding">📷</button>
      <button onclick="showInventoryAvailModal('${h.id}')" class="btn-icon" title="Set Availability">📅</button>
      <button onclick="handleDeleteInventory('${h.id}')" class="btn-icon btn-icon-danger" title="Delete">🗑</button>
    </div>
  </div>`;
}

// ============================================================
// PHOTO EDITOR — Upload photo, then draw red box on it
// ============================================================
function showPhotoEditor(hId) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
  const modal = document.getElementById('modal-overlay');
  const imgs = h.images || [];

  modal.innerHTML = `<div class="modal-card photo-editor-modal">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h2>📷 Hoarding Photos — ${h.title}</h2>
    <p class="photo-editor-subtitle">
      Upload a <strong>street-level photo</strong> of your hoarding site. Then drag the
      <span style="color:#e74c3c;font-weight:700">red box</span> to mark exactly where your hoarding is.
    </p>

    <!-- Photo Grid -->
    <div class="photo-editor-grid" id="photo-grid">
      ${imgs.map((img, i) => `
      <div class="photo-grid-item ${i === (h._activePhotoIdx||0) ? 'active-photo' : ''}"
           onclick="setActivePhoto('${hId}', ${i})">
        <img src="${img}" class="photo-grid-thumb"/>
        <div class="photo-grid-overlay">
          <button onclick="event.stopPropagation();handleDeleteHoardingImage('${hId}',${i})" class="photo-del-btn">🗑</button>
          ${i === (h._activePhotoIdx||0) ? '<span class="photo-active-label">Editing</span>' : ''}
        </div>
        <div class="photo-grid-num">${i+1}</div>
      </div>`).join('')}
      ${imgs.length < 8 ? `
      <label class="photo-grid-add">
        <div class="photo-add-icon">+</div>
        <div class="photo-add-label">Upload Photo</div>
        <input type="file" accept="image/*" multiple style="display:none"
               onchange="handleUploadHoardingImage(event,'${hId}')"/>
      </label>` : ''}
    </div>

    <!-- Red Box Editor -->
    ${imgs.length > 0 ? `
    <div class="red-box-section">
      <div class="red-box-header">
        <span>📍 Mark Hoarding Position on Photo ${(h._activePhotoIdx||0)+1}</span>
        <span class="red-box-hint">Drag box to position · Drag corners to resize</span>
      </div>
      <div class="rs-backdrop" id="rs-backdrop">
        <img src="${imgs[h._activePhotoIdx||0]}" class="rs-background-photo" id="rs-bg-photo"
             draggable="false"/>
        <div class="rs-overlay" id="rs-overlay"
             style="left:${h.redSquare?.x||40}px;top:${h.redSquare?.y||30}px;
                    width:${h.redSquare?.w||200}px;height:${h.redSquare?.h||100}px">
          <div class="rs-label">HOARDING</div>
          <div class="rs-handle rs-tl" onmousedown="rsResizeStart(event,'tl')"></div>
          <div class="rs-handle rs-tr" onmousedown="rsResizeStart(event,'tr')"></div>
          <div class="rs-handle rs-bl" onmousedown="rsResizeStart(event,'bl')"></div>
          <div class="rs-handle rs-br" onmousedown="rsResizeStart(event,'br')"></div>
        </div>
      </div>
      <div class="red-box-actions">
        <button onclick="saveRedBox('${hId}')" class="btn-form-primary" style="max-width:220px">
          💾 Save Position
        </button>
        <button onclick="resetRedBox()" class="btn-ghost" style="max-width:120px">Reset</button>
      </div>
    </div>` : `
    <div class="no-photos-placeholder">
      <div style="font-size:48px;margin-bottom:12px">📷</div>
      <h3>Upload a Street Photo First</h3>
      <p>Take a photo of your hoarding site (like the GPS-tagged WhatsApp photo) and upload it.<br>
         Then you'll draw a red box to mark exactly where your hoarding is.</p>
      <label class="btn-form-primary" style="display:inline-block;max-width:220px;text-align:center;cursor:pointer;margin-top:8px">
        📤 Upload Photo Now
        <input type="file" accept="image/*" multiple style="display:none"
               onchange="handleUploadHoardingImage(event,'${hId}')"/>
      </label>
    </div>`}

  </div>`;
  modal.classList.add('active');
  AppState._currentRedSquare = h.redSquare || { x: 40, y: 30, w: 200, h: 100 };
  if (imgs.length > 0) initRedSquareDrag();
}

function setActivePhoto(hId, idx) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
  if (!h) return;
  h._activePhotoIdx = idx;
  AppState.save();
  showPhotoEditor(hId);
}

function saveRedBox(hId) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
  if (!h) return;
  // Get pixel positions relative to the backdrop
  const backdrop = document.getElementById('rs-backdrop');
  const overlay = document.getElementById('rs-overlay');
  const bgPhoto = document.getElementById('rs-bg-photo');
  if (!backdrop || !overlay || !bgPhoto) return;

  // Convert px positions to percentages (relative to photo size)
  const photoW = bgPhoto.naturalWidth || bgPhoto.clientWidth;
  const photoH = bgPhoto.naturalHeight || bgPhoto.clientHeight;
  const displayW = bgPhoto.clientWidth;
  const displayH = bgPhoto.clientHeight;
  const scaleX = photoW / displayW;
  const scaleY = photoH / displayH;

  const x = parseInt(overlay.style.left);
  const y = parseInt(overlay.style.top);
  const w = parseInt(overlay.style.width);
  const ht = parseInt(overlay.style.height);

  h.redSquare = {
    x: Math.round(x * scaleX),
    y: Math.round(y * scaleY),
    w: Math.round(w * scaleX),
    h: Math.round(ht * scaleY),
    // Also store display coords for re-rendering
    dx: x, dy: y, dw: w, dh: ht
  };
  AppState.save();
  showToast('✅ Hoarding position saved!', 'success');
  // Refresh the backdrop to show the saved position
  AppState._currentRedSquare = { x, y, w, h: ht };
}

function resetRedBox() {
  const overlay = document.getElementById('rs-overlay');
  if (!overlay) return;
  const backdrop = document.getElementById('rs-backdrop');
  const w = backdrop?.clientWidth || 400;
  const h = backdrop?.clientHeight || 280;
  const newX = Math.round(w * 0.3), newY = Math.round(h * 0.2);
  const newW = Math.round(w * 0.4), newH = Math.round(h * 0.35);
  overlay.style.left = newX + 'px';
  overlay.style.top = newY + 'px';
  overlay.style.width = newW + 'px';
  overlay.style.height = newH + 'px';
  AppState._currentRedSquare = { x: newX, y: newY, w: newW, h: newH };
}

// ── Add/Edit Inventory Modal ──────────────────────────────────
function showAddInventoryModal(editId = null) {
  const h = editId ? SPYDEE_DATA.hoardings.find(x => x.id === editId) : null;
  const modal = document.getElementById('modal-overlay');

  modal.innerHTML = `<div class="modal-card inventory-modal">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h2>${h ? '✏️ Edit Hoarding' : '🏗 Add New Hoarding'}</h2>

    <form onsubmit="${h ? `handleUpdateInventory(event,'${editId}')` : 'handleAddInventory(event)'}">

      <!-- Step indicator -->
      <div class="form-steps">
        <div class="form-step active">1 · Details</div>
        <div class="form-step-div">→</div>
        <div class="form-step">2 · Photos</div>
        <div class="form-step-div">→</div>
        <div class="form-step">3 · Live</div>
      </div>

      <div class="form-section-title">📋 Basic Information</div>
      <div class="form-row">
        <div class="form-group" style="flex:2">
          <label>Board Title *</label>
          <input id="inv-title" required value="${h?.title||''}" placeholder="Wakad Junction Mega Backlit"/>
        </div>
        <div class="form-group">
          <label>Type *</label>
          <select id="inv-type">
            ${['Backlit','Digital LED','Flex'].map(t=>`<option ${h?.type===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Full Location Address *</label>
        <input id="inv-location" required value="${h?.location||''}"
               placeholder="Near D-Mart, Wakad Chowk, Pune - 411057"/>
      </div>

      <div class="form-section-title">📍 GPS Location</div>
      <div class="form-group">
        <label>Google Maps Link</label>
        <input type="url" id="inv-gmaps" value="${h?.gmapsLink||''}"
               placeholder="https://maps.google.com/?q=18.5986,73.7611"
               onblur="parseGmapsLink()"/>
        <small class="hint">📱 Tip: Open Google Maps → Share → Copy link. Lat/Lng auto-extracted.</small>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Latitude</label>
          <input type="number" id="inv-lat" step="0.00001" value="${h?.lat||18.5642}"/>
        </div>
        <div class="form-group">
          <label>Longitude</label>
          <input type="number" id="inv-lng" step="0.00001" value="${h?.lng||73.8482}"/>
        </div>
      </div>

      <div class="form-section-title">📐 Dimensions & Specs</div>
      <div class="form-row">
        <div class="form-group"><label>Width (ft) *</label><input type="number" id="inv-width" required value="${h?.width||30}" min="5" max="120"/></div>
        <div class="form-group"><label>Height (ft) *</label><input type="number" id="inv-height" required value="${h?.height||15}" min="5" max="60"/></div>
        <div class="form-group">
          <label>Orientation</label>
          <select id="inv-orientation">
            <option ${h?.orientation==='LHS'?'selected':''}>LHS</option>
            <option ${h?.orientation==='RHS'?'selected':''}>RHS</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group"><label>Base Price / Month (₹) *</label><input type="number" id="inv-price" required value="${h?.basePriceMonthly||50000}" min="1000"/></div>
        <div class="form-group"><label>Daily Impressions</label><input type="number" id="inv-imp" value="${h?.dailyImpression||15000}"/></div>
      </div>

      <div class="form-row">
        <div class="form-group"><label>Material</label><input id="inv-material" value="${h?.material||'Star Flex 440 GSM'}"/></div>
        <div class="form-group"><label>Illumination</label><input id="inv-illum" value="${h?.illumination||'LED Backlit 6000K'}"/></div>
      </div>

      <div class="form-row">
        <div class="form-group"><label>Print Specification</label><input id="inv-printspec" value="${h?.printSpec||'6x4 Solvent Print, 1440 DPI'}"/></div>
        <div class="form-group">
          <label>Traffic Level</label>
          <select id="inv-traffic">
            ${['Low','Medium','High','Very High'].map(t=>`<option ${h?.traffic===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>

      ${!h ? `<div class="add-photo-nudge">
        <span>📷</span>
        <span>After saving, you'll be taken to the <strong>Photo Editor</strong> to upload a site photo and mark your hoarding's position.</span>
      </div>` : ''}

      <div class="modal-actions">
        <button type="submit" class="btn-form-primary">${h ? '💾 Save Changes' : '➡ Save & Add Photos'}</button>
        <button type="button" onclick="closeModal()" class="btn-ghost">Cancel</button>
      </div>
    </form>
  </div>`;
  modal.classList.add('active');
}

function showEditInventoryModal(id) { showAddInventoryModal(id); }

function gatherInventoryForm() {
  const gmaps = document.getElementById('inv-gmaps').value;
  let lat = parseFloat(document.getElementById('inv-lat').value);
  let lng = parseFloat(document.getElementById('inv-lng').value);
  const match = gmaps.match(/[?&]q=([-\d.]+),([-\d.]+)/);
  if (match) { lat = parseFloat(match[1]); lng = parseFloat(match[2]); }
  return {
    title: document.getElementById('inv-title').value,
    type: document.getElementById('inv-type').value,
    location: document.getElementById('inv-location').value,
    lat, lng, gmapsLink: gmaps,
    width: document.getElementById('inv-width').value,
    height: document.getElementById('inv-height').value,
    orientation: document.getElementById('inv-orientation').value,
    basePriceMonthly: document.getElementById('inv-price').value,
    dailyImpression: document.getElementById('inv-imp').value,
    material: document.getElementById('inv-material').value,
    illumination: document.getElementById('inv-illum').value,
    printSpec: document.getElementById('inv-printspec').value,
    traffic: document.getElementById('inv-traffic').value,
    redSquare: AppState._currentRedSquare || { x: 40, y: 30, w: 200, h: 100 }
  };
}

function parseGmapsLink() {
  const val = document.getElementById('inv-gmaps')?.value;
  if (!val) return;
  const match = val.match(/[?&@]q?=([-\d.]+),([-\d.]+)/) || val.match(/([-\d.]{7,}),([-\d.]{7,})/);
  if (match) {
    document.getElementById('inv-lat').value = match[1];
    document.getElementById('inv-lng').value = match[2];
    showToast('📍 Coordinates extracted from Maps link!', 'success');
  }
}

function handleAddInventory(e) {
  e.preventDefault();
  const result = AppState.addInventory(gatherInventoryForm());
  if (result.ok) {
    closeModal();
    showToast('✅ Hoarding saved! Now add a street photo.', 'success');
    renderDashboard();
    // Auto-open photo editor for new hoarding
    setTimeout(() => showPhotoEditor(result.hoarding.id), 400);
  } else showToast('Failed to save.', 'error');
}

function handleUpdateInventory(e, id) {
  e.preventDefault();
  const result = AppState.updateInventory(id, gatherInventoryForm());
  if (result.ok) { closeModal(); showToast('✅ Hoarding updated!', 'success'); renderDashboard(); }
  else showToast('Update failed.', 'error');
}

function handleDeleteInventory(id) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === id);
  if (h?.status === 'booked') return showToast('Cannot delete a booked hoarding.', 'error');
  if (!confirm(`Delete "${h?.title}"? This cannot be undone.`)) return;
  const result = AppState.deleteInventory(id);
  if (result.ok) { showToast('Hoarding deleted.', 'success'); renderDashboard(); }
  else showToast('Delete failed.', 'error');
}

// ── Image Upload (used inside photo editor) ───────────────────
function handleUploadHoardingImage(e, hId) {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);

  let loaded = 0;
  files.forEach(file => {
    const r = new FileReader();
    r.onload = ev => {
      AppState.uploadHoardingImage(hId, ev.target.result);
      loaded++;
      if (loaded === files.length) {
        // Set active photo to first new one
        h._activePhotoIdx = (h.images?.length || 1) - 1;
        showToast(`📷 ${loaded} photo${loaded>1?'s':''} uploaded!`, 'success');
        showPhotoEditor(hId);
      }
    };
    r.readAsDataURL(file);
  });
}

function handleDeleteHoardingImage(hId, index) {
  if (!confirm('Remove this photo?')) return;
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
  AppState.deleteHoardingImage(hId, index);
  if (h._activePhotoIdx >= (h.images?.length || 0)) h._activePhotoIdx = 0;
  showToast('Photo removed.', 'success');
  showPhotoEditor(hId);
}

// ── Availability Modal ────────────────────────────────────────
function showInventoryAvailModal(id) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === id);
  const months = ['2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03'];
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `<div class="modal-card" style="max-width:460px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>📅 Set Availability — ${h.title}</h3>
    <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">
      Toggle which months are open for new bookings.
    </p>
    <div class="avail-grid">
      ${months.map(m => `
      <label class="avail-toggle">
        <input type="checkbox" ${h.availability?.[m] ? 'checked' : ''}
               onchange="toggleMonthAvail('${id}','${m}',this.checked)"/>
        <span class="avail-month">${m}</span>
        <span class="avail-status ${h.availability?.[m] ? 'avail-open' : 'avail-blocked'}">
          ${h.availability?.[m] ? '✓ Open' : '✕ Blocked'}
        </span>
      </label>`).join('')}
    </div>
    <div class="modal-actions">
      <button onclick="setAllAvail('${id}',true)" class="btn-xs-primary">Open All</button>
      <button onclick="setAllAvail('${id}',false)" class="btn-xs">Block All</button>
      <button onclick="closeModal()" class="btn-form-primary" style="flex:1">Done</button>
    </div>
  </div>`;
  modal.classList.add('active');
}

function toggleMonthAvail(hId, month, val) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
  if (!h) return;
  if (!h.availability) h.availability = {};
  h.availability[month] = val;
  AppState.save();
  const label = document.querySelector(`input[onchange*="${hId}"][onchange*="${month}"]`)?.closest('.avail-toggle');
  if (label) {
    const el = label.querySelector('.avail-status');
    el.textContent = val ? '✓ Open' : '✕ Blocked';
    el.className = 'avail-status ' + (val ? 'avail-open' : 'avail-blocked');
  }
}

function setAllAvail(hId, val) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
  if (!h) return;
  if (!h.availability) h.availability = {};
  ['2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03'].forEach(m => h.availability[m] = val);
  AppState.save();
  showInventoryAvailModal(hId);
}

// ── Proof of Performance ──────────────────────────────────────
function triggerProofUpload(bookingId) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      const b = SPYDEE_DATA.bookings.find(x => x.id === bookingId);
      if (b) { b.proofOfPerf = ev.target.result; AppState.save(); }
      showToast('📸 Proof of performance uploaded!', 'success');
      renderDashboard();
    };
    r.readAsDataURL(f);
  };
  inp.click();
}

function viewProofImage(bookingId) {
  const b = SPYDEE_DATA.bookings.find(x => x.id === bookingId);
  if (!b?.proofOfPerf) return;
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `<div class="modal-card" style="max-width:600px;text-align:center">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>📸 Proof of Performance</h3>
    <img src="${b.proofOfPerf}" style="width:100%;border-radius:8px;margin-top:12px;border:1px solid var(--border)"/>
    <button onclick="closeModal()" class="btn-form-primary" style="margin-top:16px">Close</button>
  </div>`;
  modal.classList.add('active');
}

function deleteProofImage(bookingId) {
  if (!confirm('Remove proof of performance?')) return;
  const b = SPYDEE_DATA.bookings.find(x => x.id === bookingId);
  if (b) { b.proofOfPerf = null; AppState.save(); showToast('Proof removed.', 'success'); renderDashboard(); }
}

// ── Red Square Drag/Resize Engine ────────────────────────────
let _rsState = { mode: null, startX: 0, startY: 0, origRect: null };

function initRedSquareDrag() {
  setTimeout(() => {
    const overlay = document.getElementById('rs-overlay');
    const backdrop = document.getElementById('rs-backdrop');
    if (!overlay || !backdrop) return;

    overlay.addEventListener('mousedown', e => {
      if (e.target.classList.contains('rs-handle')) return;
      e.preventDefault();
      _rsState.mode = 'drag';
      _rsState.startX = e.clientX; _rsState.startY = e.clientY;
      _rsState.origRect = {
        x: parseInt(overlay.style.left), y: parseInt(overlay.style.top),
        w: parseInt(overlay.style.width), h: parseInt(overlay.style.height)
      };
      overlay.style.cursor = 'grabbing';
    });
    overlay.addEventListener('touchstart', e => {
      if (e.target.classList.contains('rs-handle')) return;
      e.preventDefault();
      const t = e.touches[0];
      _rsState.mode = 'drag';
      _rsState.startX = t.clientX; _rsState.startY = t.clientY;
      _rsState.origRect = {
        x: parseInt(overlay.style.left), y: parseInt(overlay.style.top),
        w: parseInt(overlay.style.width), h: parseInt(overlay.style.height)
      };
    }, { passive: false });

    const onMove = (clientX, clientY) => {
      if (!_rsState.mode) return;
      const dx = clientX - _rsState.startX, dy = clientY - _rsState.startY;
      const bRect = backdrop.getBoundingClientRect();
      const r = _rsState.origRect;
      if (_rsState.mode === 'drag') {
        const newX = Math.max(0, Math.min(bRect.width - r.w, r.x + dx));
        const newY = Math.max(0, Math.min(bRect.height - r.h, r.y + dy));
        overlay.style.left = newX + 'px'; overlay.style.top = newY + 'px';
      } else if (_rsState.mode === 'br') {
        overlay.style.width = Math.max(50, r.w + dx) + 'px';
        overlay.style.height = Math.max(30, r.h + dy) + 'px';
      } else if (_rsState.mode === 'tr') {
        overlay.style.width = Math.max(50, r.w + dx) + 'px';
        const nH = Math.max(30, r.h - dy);
        overlay.style.height = nH + 'px';
        overlay.style.top = (r.y + r.h - nH) + 'px';
      } else if (_rsState.mode === 'bl') {
        const nW = Math.max(50, r.w - dx);
        overlay.style.width = nW + 'px';
        overlay.style.left = (r.x + r.w - nW) + 'px';
        overlay.style.height = Math.max(30, r.h + dy) + 'px';
      } else if (_rsState.mode === 'tl') {
        const nW = Math.max(50, r.w - dx), nH = Math.max(30, r.h - dy);
        overlay.style.width = nW + 'px'; overlay.style.height = nH + 'px';
        overlay.style.left = (r.x + r.w - nW) + 'px';
        overlay.style.top = (r.y + r.h - nH) + 'px';
      }
      AppState._currentRedSquare = {
        x: parseInt(overlay.style.left), y: parseInt(overlay.style.top),
        w: parseInt(overlay.style.width), h: parseInt(overlay.style.height)
      };
    };

    document.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    document.addEventListener('touchmove', e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    document.addEventListener('mouseup', () => { _rsState.mode = null; if (overlay) overlay.style.cursor = 'grab'; });
    document.addEventListener('touchend', () => { _rsState.mode = null; });
  }, 150);
}

function rsResizeStart(e, corner) {
  e.preventDefault(); e.stopPropagation();
  const overlay = document.getElementById('rs-overlay');
  _rsState.mode = corner;
  _rsState.startX = e.clientX || e.touches?.[0]?.clientX;
  _rsState.startY = e.clientY || e.touches?.[0]?.clientY;
  _rsState.origRect = {
    x: parseInt(overlay.style.left), y: parseInt(overlay.style.top),
    w: parseInt(overlay.style.width), h: parseInt(overlay.style.height)
  };
}
