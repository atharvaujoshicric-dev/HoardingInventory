// ============================================================
// SPYDEE v3 — Advertiser Dashboard (Real Leaflet Map)
// ============================================================

function renderAdvertiserView() {
  const hoardings = AppState.getFilteredHoardings();
  const user = AppState.currentUser;
  const myHolds = SPYDEE_DATA.hoardings.filter(h => h.holdBy === user.id && h.status === 'on-hold');
  const myBookings = SPYDEE_DATA.bookings.filter(b => b.customerId === user.id);

  return `<div class="advertiser-view">
    <div class="split-pane">
      <!-- LEFT: Real Map + Visualizer -->
      <div class="map-pane">
        <div class="map-toolbar">
          <div class="map-toolbar-left">
            <span class="map-label">🗺 Pune & PCMC</span>
            <span class="map-count" id="map-count">${hoardings.length}/${SPYDEE_DATA.hoardings.length} boards</span>
            <span class="map-hint">Click map or drag 📍 pin to search</span>
          </div>
          <div class="map-toolbar-right">
            <div class="search-bar-mini">
              <input type="text" placeholder="🔍 Search boards..." value="${AppState._searchQuery}"
                     oninput="mapSearch(this.value)" class="map-search-input"/>
            </div>
          </div>
        </div>

        <!-- REAL LEAFLET MAP -->
        <div id="leaflet-map" style="width:100%;height:420px;z-index:1;"></div>

        <div class="map-info-bar" id="map-info-bar">
          📍 ${AppState.mapPin.lat.toFixed(4)}, ${AppState.mapPin.lng.toFixed(4)}
          &nbsp;|&nbsp; ⭕ Radius: <strong>${AppState.radiusKm}km</strong>
          &nbsp;|&nbsp; ${hoardings.length} boards in range
        </div>

        <!-- Creative Visualizer -->
        <div class="creative-visualizer">
          <div class="viz-header">
            <h4>🎨 Creative Mockup Visualizer</h4>
            <p>Upload your artwork to preview it on a selected hoarding</p>
          </div>
          <div class="viz-drop-zone" id="viz-drop"
               ondragover="event.preventDefault()" ondrop="handleCreativeDrop(event)"
               onclick="document.getElementById('creative-upload').click()">
            ${AppState.uploadedCreative
              ? `<div class="creative-preview-row">
                   <img src="${AppState.uploadedCreative}" style="height:52px;border-radius:4px;border:1px solid var(--border)"/>
                   <div>
                     <div style="font-size:12px;color:var(--green);font-weight:600">✓ Creative loaded</div>
                     <button onclick="event.stopPropagation();clearCreative()" class="btn-del-creative">🗑 Remove</button>
                   </div>
                 </div>`
              : `<div class="drop-icon">⬆️</div><p>Drop artwork here or click to upload</p><span class="drop-hint">PNG, JPG, WebP — any size</span>`}
          </div>
          <input type="file" id="creative-upload" accept="image/*" style="display:none" onchange="handleCreativeUpload(event)"/>
          ${AppState.selectedHoarding && AppState.uploadedCreative ? renderBillboardMockup() : ''}
        </div>
      </div>

      <!-- RIGHT: Filters + Cards -->
      <div class="sidebar-pane">
        ${myHolds.length > 0 ? `<div class="holds-panel">
          <h4>⏱ Active Holds (${myHolds.length})</h4>
          ${myHolds.map(h => renderHoldBanner(h)).join('')}
        </div>` : ''}

        <div class="filter-panel">
          <div class="filter-header-row">
            <h3 class="filter-title">🔍 Filters</h3>
            <button onclick="clearAllFilters()" class="btn-xs">Clear All</button>
          </div>
          <div class="filter-section">
            <label>Search Radius: <strong id="radius-val">${AppState.radiusKm}km</strong></label>
            <input type="range" min="0.5" max="15" step="0.5" value="${AppState.radiusKm}"
                   oninput="syncRadiusSlider(this.value)" class="range-input"/>
            <div class="range-labels"><span>500m</span><span>15km</span></div>
          </div>
          <div class="filter-section">
            <label>Board Type</label>
            <div class="filter-chips">
              ${['all','Backlit','Digital LED','Flex'].map(t => `
                <button class="chip ${AppState.filters.type === t ? 'active' : ''}"
                        onclick="setFilter('type','${t}')">${t === 'all' ? 'All Types' : t}</button>`).join('')}
            </div>
          </div>
          <div class="filter-section">
            <label>Availability</label>
            <div class="filter-chips">
              ${['all','available','on-hold','booked'].map(s => `
                <button class="chip ${AppState.filters.status === s ? 'active' : ''}"
                        onclick="setFilter('status','${s}')">${s === 'all' ? 'All' : s}</button>`).join('')}
            </div>
          </div>
          <div class="filter-section">
            <label>Traffic Level</label>
            <div class="filter-chips">
              ${['all','Low','Medium','High','Very High'].map(t => `
                <button class="chip ${AppState.filters.traffic === t ? 'active' : ''}"
                        onclick="setFilter('traffic','${t}')">${t === 'all' ? 'All' : t}</button>`).join('')}
            </div>
          </div>
          <div class="filter-section">
            <label>Monthly Budget</label>
            <div class="price-inputs">
              <input type="number" placeholder="Min ₹" value="${AppState.filters.minPrice || ''}"
                     oninput="setFilter('minPrice',this.value||0)" class="price-input"/>
              <span>–</span>
              <input type="number" placeholder="Max ₹" value="${AppState.filters.maxPrice < 999999 ? AppState.filters.maxPrice : ''}"
                     oninput="setFilter('maxPrice',this.value||999999)" class="price-input"/>
            </div>
          </div>
          <div class="filter-section">
            <label>Media Owner</label>
            <select onchange="setFilter('vendor',this.value)" class="filter-select">
              <option value="all">All Vendors</option>
              ${SPYDEE_DATA.users.filter(u => u.role === 'vendor').map(v =>
                `<option value="${v.id}" ${AppState.filters.vendor === v.id ? 'selected' : ''}>${v.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="hoarding-cards" id="hoarding-cards">
          ${hoardings.length === 0
            ? `<div class="empty-state">No hoardings in range.<br>Click the map to repin your location or expand the radius.</div>`
            : hoardings.map(h => renderHoardingCard(h)).join('')}
        </div>

        ${myBookings.length > 0 ? `<div class="my-bookings">
          <h4>📋 My Campaigns</h4>
          ${myBookings.map(b => renderMyBookingCard(b)).join('')}
        </div>` : ''}
      </div>
    </div>
  </div>`;
}

// Initialize Leaflet after render
function afterAdvertiserRender() {
  const el = document.getElementById('leaflet-map');
  if (!el) return;
  setTimeout(() => {
    if (_mapInitialized && _leafletMap && document.getElementById('leaflet-map')) {
      // Map already running — just invalidate size and refresh markers
      _leafletMap.invalidateSize();
      refreshMapMarkers();
      updateMapInfoBar();
    } else {
      // Fresh init
      _mapInitialized = false;
      initLeafletMap('leaflet-map');
    }
  }, 60);
}

// ── Hoarding Card ─────────────────────────────────────────────
function renderHoardingCard(h) {
  const isHeld = h.status === 'on-hold', isBooked = h.status === 'booked';
  const isMyHold = h.holdBy === AppState.currentUser?.id;
  const isSel = AppState.selectedHoarding?.id === h.id;
  const dist = haversineDistance(AppState.mapPin.lat, AppState.mapPin.lng, h.lat, h.lng);
  const distStr = dist < 1000 ? (dist / 1000).toFixed(2) + 'km' : dist.toFixed(0) + 'm';

  return `<div class="hoarding-card ${isSel ? 'selected' : ''}" onclick="selectHoarding('${h.id}')">
    <div class="card-image-wrap">
      ${h.images && h.images.length > 0
        ? `<img src="${h.images[0]}" class="card-real-photo" alt="${h.title}"/>`
        : `<div class="card-image">
             <div class="billboard-thumb">
               <div class="bb-face ${h.type === 'Digital LED' ? 'bb-digital' : h.type === 'Backlit' ? 'bb-backlit' : 'bb-flex'}"
                    style="width:${Math.min(h.width * 1.8, 80)}px;height:${Math.min(h.height * 1.8, 40)}px">
                 ${AppState.uploadedCreative && isSel ? `<img src="${AppState.uploadedCreative}" style="width:100%;height:100%;object-fit:cover;border-radius:2px"/>` : ''}
               </div>
               <div class="bb-pole"></div>
             </div>
           </div>`}
      <span class="dist-badge">${distStr}</span>
      ${isBooked ? `<span class="badge-booked">BOOKED</span>` : isHeld ? `<span class="badge-hold">ON HOLD</span>` : `<span class="badge-avail">AVAIL</span>`}
      ${h.verified ? `<span class="badge-verified">✓</span>` : `<span class="badge-unverified">⏳</span>`}
      ${h.featured ? `<span class="badge-featured">⭐</span>` : ''}
    </div>
    <div class="card-body">
      <h4 class="card-title">${h.title}</h4>
      <p class="card-location">📍 ${h.location.split(',').slice(0, 2).join(',')}</p>
      <div class="card-specs">
        <span class="spec-tag">${h.width}×${h.height}ft</span>
        <span class="spec-tag">${h.type}</span>
        <span class="spec-tag">${h.orientation}</span>
        <span class="spec-tag">👁 ${(h.dailyImpression / 1000).toFixed(0)}K/day</span>
        <span class="spec-tag traffic-${(h.traffic || '').toLowerCase().replace(' ', '-')}">${h.traffic}</span>
      </div>
      ${h.rating > 0 ? `<div class="card-rating">${starsHTML(Math.round(h.rating))} <span style="font-size:11px;color:var(--text-muted)">${h.rating.toFixed(1)} (${h.reviewCount})</span></div>` : ''}
      <div class="card-footer">
        <div class="card-price">
          <span class="price-main">${formatCurrency(h.basePriceMonthly)}</span>
          <span class="price-unit">/mo</span>
        </div>
        <div class="card-actions">
          ${!isBooked && !isHeld
            ? `<button onclick="event.stopPropagation();handleReserve('${h.id}')" class="btn-reserve">🔒 Reserve</button>`
            : isMyHold
              ? `<button onclick="event.stopPropagation();showConfirmBookingModal('${h.id}')" class="btn-book-now">✅ Book Now</button>`
              : `<span class="unavail-label">${isBooked ? 'Booked' : 'Held'}</span>`}
        </div>
      </div>
      ${isMyHold ? `<div class="hold-countdown-bar">
        <div class="hcb-timer" id="timer-${h.id}">--:--:--</div>
        <div class="hcb-prog-wrap"><div class="hcb-progress" id="progress-${h.id}" style="width:100%"></div></div>
      </div>` : ''}
    </div>
  </div>`;
}

// ── Hold Banner ───────────────────────────────────────────────
function renderHoldBanner(h) {
  const rem = Math.max(0, h.holdExpiry - Date.now());
  const hrs = Math.floor(rem / 3600000);
  const mins = Math.floor((rem % 3600000) / 60000);
  const secs = Math.floor((rem % 60000) / 1000);
  const pct = rem / (12 * 3600000) * 100;
  return `<div class="hold-card">
    <div class="hold-info">
      <strong>${h.title.split(' ').slice(0, 3).join(' ')}</strong>
      <span class="hold-timer" id="timer-${h.id}">${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}</span>
    </div>
    <div class="hcb-prog-wrap"><div class="hcb-progress" id="progress-${h.id}"
         style="width:${pct}%;background:${pct > 50 ? 'var(--green)' : pct > 25 ? 'var(--amber)' : 'var(--red)'}"></div></div>
    <div class="hold-actions">
      <button onclick="handleCancelHold('${h.id}')" class="btn-cancel-hold">↩ Cancel & Refund</button>
      <button onclick="showConfirmBookingModal('${h.id}')" class="btn-confirm-hold">✅ Book Now</button>
    </div>
  </div>`;
}

// ── My Booking Card ───────────────────────────────────────────
function renderMyBookingCard(b) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === b.hoardingId);
  const pj = b.printJob ? SPYDEE_DATA.printJobs.find(j => j.id === b.printJob) : null;
  return `<div class="booking-mini-card">
    <div class="bmc-info">
      <strong>${h?.title || b.hoardingId}</strong>
      <span class="status-badge status-${b.status === 'confirmed' ? 'confirmed' : b.status === 'cancelled' ? 'cancelled' : 'hold'}">${b.status}</span>
    </div>
    <div class="bmc-details">${b.month} × ${b.durationMonths || 1}mo · ${formatCurrency(b.totalDue)}</div>
    ${b.status === 'confirmed' ? `<div class="bmc-actions">
      ${!b.printJob
        ? `<button onclick="handleCreatePrintJob('${b.id}')" class="btn-xs-primary">🖨 Order Print</button>`
        : `<span class="print-badge">🖨 ${pj?.status || 'ordered'}</span>
           ${pj && !pj.artworkUrl && pj.status !== 'dispatched'
             ? `<button onclick="uploadArtworkForJob('${b.printJob}')" class="btn-xs-primary">📤 Upload Art</button>`
             : ''}
           ${pj?.artworkUrl ? `<button onclick="deleteJobArtwork('${b.printJob}')" class="btn-xs" style="color:var(--red)">🗑 Art</button>` : ''}`}
      ${!b.rating ? `<button onclick="showRatingModal('${b.id}')" class="btn-xs">⭐ Rate</button>` : `<span style="color:var(--amber);font-size:13px">${'★'.repeat(b.rating)}</span>`}
      <button onclick="showCancelBookingModal('${b.id}')" class="btn-xs" style="color:var(--red)">Cancel</button>
    </div>` : ''}
  </div>`;
}

// ── Billboard Mockup ──────────────────────────────────────────
function renderBillboardMockup() {
  const h = AppState.selectedHoarding;
  if (!h) return '';
  const aspect = h.width / h.height;
  const mw = 260, mh = Math.round(mw / aspect);
  return `<div class="billboard-mockup-wrap">
    <h5>📐 ${h.title.split(' ').slice(0, 3).join(' ')} · ${h.width}×${h.height}ft</h5>
    <div class="billboard-scene">
      <div class="billboard-perspective" style="width:${mw}px;height:${mh}px">
        <img src="${AppState.uploadedCreative}" class="billboard-creative"/>
      </div>
      <div class="billboard-support"><div class="support-pole"></div><div class="support-base"></div></div>
    </div>
    <p class="mockup-hint">☀️ Day view · ${h.width}×${h.height}ft billboard</p>
  </div>`;
}

// ── Invoice Modal ─────────────────────────────────────────────
function showConfirmBookingModal(hoardingId) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
  const user = SPYDEE_DATA.users.find(u => u.id === AppState.currentUser.id);
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `<div class="modal-card invoice-card">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="invoice-header">
      <div class="inv-logo">🕷</div>
      <div>
        <h2 class="invoice-title">TAX INVOICE</h2>
        <p style="color:var(--text-muted);font-size:12px">Spydee OOH Marketplace · GSTIN: 27AABCS1234X1ZY</p>
      </div>
    </div>
    <div class="inv-hoarding-info">
      <strong>📍 ${h.title}</strong>
      <span>${h.location.split(',').slice(0, 2).join(',')}</span>
      <span>${h.width}×${h.height}ft · ${h.type} · ${h.traffic} Traffic</span>
    </div>
    <div class="form-row" style="margin-bottom:16px">
      <div class="form-group">
        <label>Campaign Month</label>
        <select id="booking-month" class="filter-select">
          ${['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03'].map(m =>
            `<option value="${m}">${m}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Duration</label>
        <select id="booking-duration" class="filter-select" onchange="updateInvoicePreview('${hoardingId}')">
          <option value="1">1 Month</option>
          <option value="2">2 Months</option>
          <option value="3">3 Months</option>
          <option value="6">6 Months</option>
        </select>
      </div>
    </div>
    <div class="invoice-table" id="invoice-preview">${getInvoiceHTML(h.basePriceMonthly, 1)}</div>
    <div class="invoice-wallet">
      Current Wallet: <strong style="color:var(--green)" id="inv-wallet">${formatCurrency(user?.wallet || 0)}</strong>
    </div>
    <div class="modal-actions">
      <button onclick="handleConfirmBooking('${hoardingId}')" class="btn-form-primary">✅ Confirm & Pay</button>
      <button onclick="closeModal()" class="btn-ghost">Cancel</button>
    </div>
  </div>`;
  modal.classList.add('active');
}

function getInvoiceHTML(baseMonthly, duration) {
  const { base, gst, deposit, totalDue } = calcTax(baseMonthly * duration);
  return `
    <div class="inv-row"><span>Base Price (${duration} mo × ${formatCurrency(baseMonthly)})</span><span>${formatCurrency(base)}</span></div>
    <div class="inv-row"><span>CGST @ 9%</span><span>${formatCurrency(Math.round(gst / 2))}</span></div>
    <div class="inv-row"><span>SGST @ 9%</span><span>${formatCurrency(Math.round(gst / 2))}</span></div>
    <div class="inv-row inv-sub"><span>Gross Total</span><span>${formatCurrency(base + gst)}</span></div>
    <div class="inv-row inv-credit"><span>Less: 10% Deposit Already Paid</span><span>–${formatCurrency(deposit)}</span></div>
    <div class="inv-row inv-total"><span>Balance Due Now</span><span>${formatCurrency(totalDue)}</span></div>`;
}

function updateInvoicePreview(hId) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
  const dur = parseInt(document.getElementById('booking-duration')?.value || 1);
  const el = document.getElementById('invoice-preview');
  if (el) el.innerHTML = getInvoiceHTML(h.basePriceMonthly, dur);
}

// ── Rating ────────────────────────────────────────────────────
function showRatingModal(bookingId) {
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `<div class="modal-card" style="max-width:400px;text-align:center">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>⭐ Rate Your Campaign</h3>
    <div class="star-rating" id="star-rating">
      ${[1,2,3,4,5].map(i => `<span class="star" onclick="setRating(${i})" data-v="${i}">☆</span>`).join('')}
    </div>
    <input type="hidden" id="rating-val" value="0"/>
    <div class="form-group" style="margin-top:16px;text-align:left">
      <label>Review (optional)</label>
      <textarea id="review-text" rows="3" placeholder="Great visibility, smooth experience..."
                style="width:100%;background:var(--bg-surface);border:1px solid var(--border);color:var(--text);padding:10px;border-radius:6px;resize:vertical;font-family:var(--font-body)"></textarea>
    </div>
    <button onclick="submitRating('${bookingId}')" class="btn-form-primary">Submit Rating</button>
  </div>`;
  modal.classList.add('active');
}
function setRating(val) {
  document.getElementById('rating-val').value = val;
  document.querySelectorAll('.star').forEach((s, i) => {
    s.textContent = i < val ? '★' : '☆';
    s.style.color = i < val ? 'var(--amber)' : 'var(--text-muted)';
  });
}
function submitRating(bookingId) {
  const rating = parseInt(document.getElementById('rating-val').value);
  if (!rating) return showToast('Please select a rating.', 'error');
  AppState.rateBooking(bookingId, rating, document.getElementById('review-text').value);
  closeModal(); showToast('⭐ Rating submitted!', 'success'); renderDashboard();
}

// ── Cancel Booking ────────────────────────────────────────────
function showCancelBookingModal(bookingId) {
  const b = SPYDEE_DATA.bookings.find(x => x.id === bookingId);
  const refund = Math.round((b?.totalDue || 0) * 0.5);
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `<div class="modal-card" style="max-width:400px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>❗ Cancel Booking</h3>
    <p style="color:var(--text-muted);margin:14px 0">You will receive a <strong style="color:var(--amber)">50% refund</strong> of <strong>${formatCurrency(refund)}</strong>.</p>
    <div class="modal-actions">
      <button onclick="handleCancelBookingConfirm('${bookingId}')" class="btn-form-primary" style="background:var(--red)">Confirm Cancellation</button>
      <button onclick="closeModal()" class="btn-ghost">Keep Booking</button>
    </div>
  </div>`;
  modal.classList.add('active');
}
function handleCancelBookingConfirm(bookingId) {
  const result = AppState.cancelBooking(bookingId);
  if (result.ok) { closeModal(); showToast(`Cancelled. ${formatCurrency(result.refund)} refunded to wallet.`, 'success'); renderDashboard(); }
  else showToast(result.msg, 'error');
}

// ── Artwork ───────────────────────────────────────────────────
function uploadArtworkForJob(jobId) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => { AppState.updatePrintJobArtwork(jobId, ev.target.result); showToast('🎨 Artwork uploaded!', 'success'); renderDashboard(); };
    r.readAsDataURL(f);
  };
  inp.click();
}
function deleteJobArtwork(jobId) {
  if (!confirm('Remove artwork?')) return;
  AppState.deletePrintJobArtwork(jobId); showToast('Artwork removed.', 'success'); renderDashboard();
}

// ── Handlers ──────────────────────────────────────────────────
function selectHoarding(id) {
  AppState.selectedHoarding = SPYDEE_DATA.hoardings.find(h => h.id === id);
  AppState.save();
  // Update sidebar cards and map markers without full re-render
  refreshSidebarCards();
  if (_leafletMap) refreshMapMarkers();
  // Scroll selected card into view
  setTimeout(() => {
    document.querySelector('.hoarding-card.selected')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 80);
}

function handleReserve(id) {
  const result = AppState.reserveHoarding(id);
  if (result.ok) {
    showToast(`🔒 Reserved! ${formatCurrency(result.deposit)} deposit deducted. 12-hour hold active.`, 'success');
    renderDashboard(); // full re-render to show hold banner + update wallet
  } else showToast(result.msg, 'error');
}

function handleCancelHold(id) {
  const result = AppState.cancelHold(id);
  if (result.ok) { showToast(`✅ Hold cancelled. ${formatCurrency(result.refund || 0)} refunded to wallet!`, 'success'); renderDashboard(); }
  else showToast(result.msg, 'error');
}

function handleConfirmBooking(hoardingId) {
  const month = document.getElementById('booking-month')?.value || '2025-07';
  const dur = parseInt(document.getElementById('booking-duration')?.value || 1);
  const result = AppState.confirmBooking(hoardingId, month, dur);
  if (result.ok) {
    closeModal();
    showToast(`🎉 Booking confirmed! ${formatCurrency(result.invoice.totalDue)} charged from wallet.`, 'success');
    renderDashboard();
  } else showToast(result.msg, 'error');
}

function handleCreatePrintJob(bookingId) {
  const result = AppState.createPrintJob(bookingId);
  if (result.ok) { showToast('🖨 Print job created and posted to printers!', 'success'); renderDashboard(); }
  else showToast(result.msg || 'Failed.', 'error');
}

function setFilter(k, v) {
  AppState.filters[k] = (k === 'minPrice' || k === 'maxPrice') ? Number(v) : v;
  refreshSidebarCards();
  if (_leafletMap) refreshMapMarkers();
}

function clearAllFilters() {
  AppState.filters = { type: 'all', minPrice: 0, maxPrice: 999999, vendor: 'all', status: 'all', traffic: 'all' };
  AppState.radiusKm = 3;
  AppState._searchQuery = '';
  renderDashboard();
}

function handleCreativeDrop(e) { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadCreativeFile(f); }
function handleCreativeUpload(e) { const f = e.target.files[0]; if (f) loadCreativeFile(f); }
function loadCreativeFile(f) { const r = new FileReader(); r.onload = ev => { AppState.uploadedCreative = ev.target.result; renderDashboard(); }; r.readAsDataURL(f); }
function clearCreative() { AppState.uploadedCreative = null; renderDashboard(); }

function updateCountdownDisplay(hId) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
  if (!h || !h.holdExpiry) return;
  const rem = Math.max(0, h.holdExpiry - Date.now());
  const hrs = Math.floor(rem / 3600000), mins = Math.floor((rem % 3600000) / 60000), secs = Math.floor((rem % 60000) / 1000);
  const str = `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  document.querySelectorAll(`#timer-${hId}`).forEach(el => el.textContent = str);
  const pct = rem / (12 * 3600000) * 100;
  document.querySelectorAll(`#progress-${hId}`).forEach(el => {
    el.style.width = pct + '%';
    el.style.background = pct > 50 ? 'var(--green)' : pct > 25 ? 'var(--amber)' : 'var(--red)';
  });
}
