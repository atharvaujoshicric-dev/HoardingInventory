// ============================================================
// SPYDEE - Advertiser (Customer) Dashboard View
// ============================================================

function renderAdvertiserView() {
  const hoardings = AppState.getFilteredHoardings();
  const user = AppState.currentUser;
  const myHolds = SPYDEE_DATA.hoardings.filter(h => h.holdBy === user.id && h.status === 'on-hold');
  const myBookings = SPYDEE_DATA.bookings.filter(b => b.customerId === user.id);

  return `
  <div class="advertiser-view">
    <!-- Split Layout -->
    <div class="split-pane">

      <!-- LEFT: Map Canvas -->
      <div class="map-pane">
        <div class="map-toolbar">
          <div class="map-toolbar-left">
            <span class="map-label">📍 Pune & PCMC</span>
            <span class="map-count">${hoardings.length} boards found</span>
          </div>
          <div class="map-toolbar-right">
            <div class="night-toggle">
              <span>☀️</span>
              <label class="toggle-switch">
                <input type="checkbox" id="night-toggle" ${AppState.nightMode ? 'checked' : ''} onchange="toggleNightMode()" />
                <span class="toggle-slider"></span>
              </label>
              <span>🌙</span>
            </div>
          </div>
        </div>

        <div class="map-canvas" id="map-canvas">
          ${renderMapCanvas(hoardings)}
        </div>

        <!-- Creative Visualizer -->
        <div class="creative-visualizer">
          <div class="viz-header">
            <h4>🎨 Creative Mockup Visualizer</h4>
            <p>Upload your artwork to preview on a hoarding</p>
          </div>
          <div class="viz-drop-zone" id="viz-drop-zone" 
               ondragover="event.preventDefault()"
               ondrop="handleCreativeDrop(event)"
               onclick="document.getElementById('creative-upload').click()">
            ${AppState.uploadedCreative 
              ? `<img src="${AppState.uploadedCreative}" alt="Creative" style="max-height:80px;border-radius:6px;" />
                 <p style="margin-top:4px;font-size:11px;color:var(--text-muted)">✓ Creative loaded</p>`
              : `<div class="drop-icon">⬆️</div>
                 <p>Drop artwork here or click to upload</p>
                 <span class="drop-hint">PNG, JPG, WebP supported</span>`
            }
          </div>
          <input type="file" id="creative-upload" accept="image/*" style="display:none" onchange="handleCreativeUpload(event)" />
          ${AppState.selectedHoarding && AppState.uploadedCreative ? renderBillboardMockup() : ''}
        </div>
      </div>

      <!-- RIGHT: Filter + Cards -->
      <div class="sidebar-pane">
        <!-- Filters -->
        <div class="filter-panel">
          <h3 class="filter-title">🔍 Filters</h3>
          
          <div class="filter-section">
            <label>Pin Location</label>
            <div class="pin-display">
              📍 ${AppState.mapPin.lat.toFixed(4)}, ${AppState.mapPin.lng.toFixed(4)}
              <button onclick="showPinModal()" class="btn-xs">Change</button>
            </div>
          </div>

          <div class="filter-section">
            <label>Radius: <strong id="radius-val">${AppState.radiusKm}km</strong></label>
            <input type="range" min="0.5" max="5" step="0.5" value="${AppState.radiusKm}"
                   oninput="updateRadius(this.value)" class="range-input" />
            <div class="range-labels"><span>500m</span><span>5km</span></div>
          </div>

          <div class="filter-section">
            <label>Type</label>
            <div class="filter-chips">
              ${['all','Backlit','Digital LED','Flex'].map(t => `
                <button class="chip ${AppState.filters.type === t ? 'active' : ''}"
                        onclick="setFilter('type','${t}')">${t === 'all' ? 'All' : t}</button>
              `).join('')}
            </div>
          </div>

          <div class="filter-section">
            <label>Budget (Monthly)</label>
            <div class="price-inputs">
              <input type="number" placeholder="Min ₹" value="${AppState.filters.minPrice || ''}"
                     oninput="setFilter('minPrice', this.value || 0)" class="price-input" />
              <span>–</span>
              <input type="number" placeholder="Max ₹" value="${AppState.filters.maxPrice < 999999 ? AppState.filters.maxPrice : ''}"
                     oninput="setFilter('maxPrice', this.value || 999999)" class="price-input" />
            </div>
          </div>

          <div class="filter-section">
            <label>Media Owner</label>
            <select onchange="setFilter('vendor', this.value)" class="filter-select">
              <option value="all">All Vendors</option>
              ${SPYDEE_DATA.users.filter(u => u.role === 'vendor').map(v =>
                `<option value="${v.id}" ${AppState.filters.vendor === v.id ? 'selected' : ''}>${v.name}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <!-- Active Holds -->
        ${myHolds.length > 0 ? `
        <div class="holds-panel">
          <h4>⏱ Active Holds</h4>
          ${myHolds.map(h => {
            const remaining = h.holdExpiry - Date.now();
            const hrs = Math.floor(remaining / 3600000);
            const mins = Math.floor((remaining % 3600000) / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            return `
            <div class="hold-card" id="hold-card-${h.id}">
              <div class="hold-info">
                <strong>${h.title}</strong>
                <span class="hold-timer" id="timer-${h.id}">${hrs}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}</span>
              </div>
              <div class="hold-actions">
                <button onclick="handleCancelHold('${h.id}')" class="btn-cancel-hold">Cancel (Get Refund)</button>
                <button onclick="showConfirmBookingModal('${h.id}')" class="btn-confirm-hold">Confirm Booking</button>
              </div>
            </div>`;
          }).join('')}
        </div>
        ` : ''}

        <!-- Hoarding Cards -->
        <div class="hoarding-cards" id="hoarding-cards">
          ${hoardings.length === 0 
            ? `<div class="empty-state">No hoardings found in this area. Try expanding the radius.</div>` 
            : hoardings.map(h => renderHoardingCard(h)).join('')}
        </div>

        <!-- My Bookings -->
        ${myBookings.length > 0 ? `
        <div class="my-bookings">
          <h4>📋 My Bookings</h4>
          ${myBookings.map(b => {
            const h = SPYDEE_DATA.hoardings.find(x => x.id === b.hoardingId);
            return `
            <div class="booking-mini-card">
              <div class="bmc-info">
                <strong>${h?.title || b.hoardingId}</strong>
                <span class="status-badge status-${b.status}">${b.status}</span>
              </div>
              <div class="bmc-details">
                ${b.month} · ${formatCurrency(b.basePriceMonthly)}
              </div>
              ${!b.printJob ? `
              <button onclick="handleCreatePrintJob('${b.id}')" class="btn-xs-primary">+ Request Print Job</button>
              ` : `<span class="print-badge">🖨 Print Ordered</span>`}
            </div>`;
          }).join('')}
        </div>
        ` : ''}
      </div>

    </div>
  </div>`;
}

// ── Map Canvas ────────────────────────────────────────────────
function renderMapCanvas(hoardings) {
  const mapW = 600, mapH = 400;
  const latMin = 18.44, latMax = 18.70;
  const lngMin = 73.72, lngMax = 73.95;

  function toPixel(lat, lng) {
    const x = ((lng - lngMin) / (lngMax - lngMin)) * mapW;
    const y = ((latMax - lat) / (latMax - latMin)) * mapH;
    return { x, y };
  }

  const pinPos = toPixel(AppState.mapPin.lat, AppState.mapPin.lng);
  const radiusPx = (AppState.radiusKm * 1000 / 111000) / (latMax - latMin) * mapH;

  const dots = SPYDEE_DATA.hoardings.map(h => {
    const { x, y } = toPixel(h.lat, h.lng);
    const isFiltered = hoardings.find(fh => fh.id === h.id);
    const isSelected = AppState.selectedHoarding?.id === h.id;
    const isHeld = h.status === 'on-hold';
    const isBooked = h.status === 'booked';
    const color = isBooked ? '#e74c3c' : isHeld ? '#f39c12' : h.type === 'Digital LED' ? '#00f5d4' : h.type === 'Backlit' ? '#f5a623' : '#a29bfe';

    return `
    <div class="map-marker ${isFiltered ? 'active' : 'dimmed'} ${isSelected ? 'selected' : ''}"
         style="left:${x}px;top:${y}px"
         onclick="selectHoarding('${h.id}')"
         title="${h.title}">
      <div class="marker-dot" style="background:${color}"></div>
      <div class="marker-tooltip">
        <strong>${h.title}</strong><br>
        ${formatCurrency(h.basePriceMonthly)}/mo<br>
        <span class="marker-status">${h.status}</span>
      </div>
    </div>`;
  });

  const areaLabels = [
    { name: 'Hinjawadi', lat: 18.591, lng: 73.738 },
    { name: 'Wakad', lat: 18.598, lng: 73.761 },
    { name: 'Baner', lat: 18.559, lng: 73.789 },
    { name: 'Aundh', lat: 18.559, lng: 73.808 },
    { name: 'SB Road', lat: 18.527, lng: 73.837 },
    { name: 'Kothrud', lat: 18.507, lng: 73.819 },
    { name: 'Viman Nagar', lat: 18.564, lng: 73.914 },
    { name: 'Hadapsar', lat: 18.507, lng: 73.933 },
    { name: 'Katraj', lat: 18.451, lng: 73.861 },
    { name: 'Moshi', lat: 18.672, lng: 73.847 },
    { name: 'Pimpri', lat: 18.619, lng: 73.801 },
    { name: 'Chinchwad', lat: 18.645, lng: 73.797 },
  ].map(a => {
    const { x, y } = toPixel(a.lat, a.lng);
    return `<div class="area-label" style="left:${x}px;top:${y}px">${a.name}</div>`;
  });

  const nightClass = AppState.nightMode ? 'night-mode' : '';

  return `
  <div class="map-grid ${nightClass}" style="width:${mapW}px;height:${mapH}px;position:relative;overflow:hidden;">
    <!-- Grid lines -->
    <div class="map-grid-lines"></div>
    <!-- Roads mockup -->
    <svg class="map-roads" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none">
      <!-- NH48 / Mumbai Pune Expressway rough path -->
      <path d="M 0,80 Q 150,100 300,180 Q 450,260 600,310" stroke="${AppState.nightMode ? '#3a3a50' : '#d0d0e0'}" stroke-width="4" fill="none" opacity="0.6"/>
      <!-- Ring Road -->
      <ellipse cx="300" cy="250" rx="180" ry="120" stroke="${AppState.nightMode ? '#2a2a40' : '#e0e0f0'}" stroke-width="3" fill="none" opacity="0.4"/>
      <!-- SB Road -->
      <line x1="300" y1="0" x2="320" y2="400" stroke="${AppState.nightMode ? '#3a3a50' : '#d0d0e0'}" stroke-width="3" opacity="0.5"/>
    </svg>
    <!-- Area labels -->
    ${areaLabels.join('')}
    <!-- Radius circle -->
    <div class="radius-circle" style="
      left:${pinPos.x}px;top:${pinPos.y}px;
      width:${radiusPx * 2}px;height:${radiusPx * 2}px;
      margin-left:-${radiusPx}px;margin-top:-${radiusPx}px;
    "></div>
    <!-- Pin -->
    <div class="map-pin" style="left:${pinPos.x}px;top:${pinPos.y}px"
         onclick="showPinModal()">📍</div>
    <!-- Markers -->
    ${dots.join('')}
  </div>`;
}

// ── Hoarding Card ─────────────────────────────────────────────
function renderHoardingCard(h) {
  const vendor = SPYDEE_DATA.users.find(u => u.id === h.vendorId);
  const isHeld = h.status === 'on-hold';
  const isBooked = h.status === 'booked';
  const isMyHold = h.holdBy === AppState.currentUser?.id;
  const isSelected = AppState.selectedHoarding?.id === h.id;

  const statusBadge = isBooked ? `<span class="badge-booked">BOOKED</span>`
    : isHeld ? `<span class="badge-hold">ON HOLD</span>`
    : `<span class="badge-avail">AVAILABLE</span>`;

  return `
  <div class="hoarding-card ${isSelected ? 'selected' : ''}" onclick="selectHoarding('${h.id}')">
    <div class="card-image-wrap">
      <div class="card-image" style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)">
        <div class="billboard-thumb">
          <div class="bb-structure">
            <div class="bb-face ${h.type === 'Digital LED' ? 'bb-digital' : h.type === 'Backlit' ? 'bb-backlit' : 'bb-flex'}"
                 style="width:${Math.min(h.width * 2, 80)}px;height:${Math.min(h.height * 2, 40)}px">
              ${AppState.uploadedCreative && isSelected ? `<img src="${AppState.uploadedCreative}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;" />` : ''}
            </div>
            <div class="bb-pole"></div>
          </div>
        </div>
      </div>
      ${statusBadge}
      ${h.verified ? '<span class="badge-verified">✓ Verified</span>' : ''}
    </div>
    <div class="card-body">
      <h4 class="card-title">${h.title}</h4>
      <p class="card-location">📍 ${h.location.split(',').slice(0,2).join(',')}</p>
      <div class="card-specs">
        <span class="spec-tag">${h.width}×${h.height} ft</span>
        <span class="spec-tag">${h.type}</span>
        <span class="spec-tag">${h.orientation}</span>
        <span class="spec-tag">👁 ${(h.dailyImpression / 1000).toFixed(0)}K/day</span>
      </div>
      <div class="card-footer">
        <div class="card-price">
          <span class="price-main">${formatCurrency(h.basePriceMonthly)}</span>
          <span class="price-unit">/month</span>
        </div>
        <div class="card-actions">
          ${!isBooked && !isHeld ? `
            <button onclick="event.stopPropagation();handleReserve('${h.id}')" class="btn-reserve">
              🔒 Reserve
            </button>
          ` : isMyHold ? `
            <button onclick="event.stopPropagation();showConfirmBookingModal('${h.id}')" class="btn-book-now">
              ✅ Book Now
            </button>
          ` : `<span class="unavail-label">${isBooked ? 'Booked' : 'On Hold'}</span>`}
        </div>
      </div>
      ${isMyHold ? `
      <div class="hold-countdown-bar">
        <div class="hcb-timer" id="timer-${h.id}">--:--:--</div>
        <div class="hcb-progress" id="progress-${h.id}" style="width:100%"></div>
      </div>` : ''}
    </div>
  </div>`;
}

// ── Billboard Mockup ─────────────────────────────────────────
function renderBillboardMockup() {
  const h = AppState.selectedHoarding;
  if (!h) return '';
  const aspect = h.width / h.height;
  const mw = 280, mh = Math.round(mw / aspect);

  return `
  <div class="billboard-mockup-wrap">
    <h5>📐 ${h.title}</h5>
    <div class="billboard-scene">
      <div class="billboard-perspective" style="width:${mw}px;height:${mh}px">
        <img src="${AppState.uploadedCreative}" class="billboard-creative ${AppState.nightMode ? 'night-glow' : ''}" />
        <div class="billboard-overlay ${AppState.nightMode ? 'night-overlay' : ''}"></div>
      </div>
      <div class="billboard-support">
        <div class="support-pole"></div>
        <div class="support-base"></div>
      </div>
    </div>
    <p class="mockup-hint">${AppState.nightMode ? '🌙 Night backlit simulation' : '☀️ Day view'} · ${h.width}×${h.height} ft</p>
  </div>`;
}

// ── Handlers ──────────────────────────────────────────────────
function selectHoarding(id) {
  AppState.selectedHoarding = SPYDEE_DATA.hoardings.find(h => h.id === id);
  renderDashboard();
  // scroll card into view
  setTimeout(() => {
    document.querySelector(`.hoarding-card.selected`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

function handleReserve(id) {
  if (!AppState.currentUser) return showToast('Please log in first.', 'error');
  const result = AppState.reserveHoarding(id);
  if (result.ok) {
    showToast(`🔒 Reserved! Deposit of ${formatCurrency(result.deposit)} deducted. 12h hold active.`, 'success');
    renderDashboard();
  } else {
    showToast(result.msg, 'error');
  }
}

function handleCancelHold(id) {
  const result = AppState.cancelHold(id);
  if (result.ok) {
    showToast('✅ Hold cancelled. Full deposit refunded to wallet.', 'success');
    renderDashboard();
  } else {
    showToast(result.msg, 'error');
  }
}

function showConfirmBookingModal(hoardingId) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
  const { base, gst, deposit, totalDue } = calcTax(h.basePriceMonthly);
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `
  <div class="modal-card invoice-card">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h2 class="invoice-title">📄 Invoice Preview</h2>
    <h3>${h.title}</h3>
    <div class="invoice-table">
      <div class="inv-row"><span>Base Price (1 Month)</span><span>${formatCurrency(base)}</span></div>
      <div class="inv-row"><span>GST @ 18%</span><span>${formatCurrency(gst)}</span></div>
      <div class="inv-row inv-sub"><span>Gross Total</span><span>${formatCurrency(base + gst)}</span></div>
      <div class="inv-row inv-credit"><span>Less: 10% Deposit Paid</span><span>-${formatCurrency(deposit)}</span></div>
      <div class="inv-row inv-total"><span>Balance Due</span><span>${formatCurrency(totalDue)}</span></div>
    </div>
    <div class="invoice-wallet">
      Wallet Balance: <strong>${formatCurrency(AppState.currentUser?.wallet || 0)}</strong>
    </div>
    <div class="modal-actions">
      <select id="booking-month" class="filter-select">
        <option>2025-07</option><option>2025-08</option><option>2025-09</option><option>2025-10</option>
      </select>
      <button onclick="handleConfirmBooking('${hoardingId}')" class="btn-form-primary">Confirm & Pay ${formatCurrency(totalDue)}</button>
      <button onclick="closeModal()" class="btn-ghost">Cancel</button>
    </div>
  </div>`;
  modal.classList.add('active');
}

function handleConfirmBooking(hoardingId) {
  const month = document.getElementById('booking-month')?.value || '2025-07';
  const result = AppState.confirmBooking(hoardingId, month);
  if (result.ok) {
    closeModal();
    showToast(`🎉 Booking confirmed! Invoice total: ${formatCurrency(result.invoice.totalDue)}`, 'success');
    renderDashboard();
  } else {
    showToast(result.msg, 'error');
  }
}

function handleCreatePrintJob(bookingId) {
  const result = AppState.createPrintJob(bookingId);
  if (result.ok) {
    showToast('🖨 Print job created and sent to printers!', 'success');
    renderDashboard();
  } else {
    showToast('Failed to create print job.', 'error');
  }
}

function toggleNightMode() {
  AppState.nightMode = !AppState.nightMode;
  renderDashboard();
}

function setFilter(key, value) {
  AppState.filters[key] = key === 'minPrice' || key === 'maxPrice' ? Number(value) : value;
  renderDashboard();
}

function updateRadius(val) {
  AppState.radiusKm = Number(val);
  document.getElementById('radius-val').textContent = val + 'km';
  // Debounce
  clearTimeout(AppState._radiusTimer);
  AppState._radiusTimer = setTimeout(() => renderDashboard(), 300);
}

function showPinModal() {
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `
  <div class="modal-card" style="max-width:400px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>📍 Set Search Center</h3>
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Enter coordinates or pick a landmark</p>
    <div class="form-row">
      <div class="form-group">
        <label>Latitude</label>
        <input type="number" id="pin-lat" value="${AppState.mapPin.lat}" step="0.001" />
      </div>
      <div class="form-group">
        <label>Longitude</label>
        <input type="number" id="pin-lng" value="${AppState.mapPin.lng}" step="0.001" />
      </div>
    </div>
    <div class="landmark-grid">
      ${[
        { name: 'Hinjawadi IT Park', lat: 18.591, lng: 73.738 },
        { name: 'SB Road', lat: 18.527, lng: 73.837 },
        { name: 'Wakad Chowk', lat: 18.598, lng: 73.761 },
        { name: 'Pimpri Camp', lat: 18.619, lng: 73.801 },
        { name: 'Viman Nagar', lat: 18.564, lng: 73.914 },
        { name: 'Kothrud', lat: 18.506, lng: 73.818 },
      ].map(l => `
        <button class="landmark-btn" onclick="setPin(${l.lat},${l.lng})">${l.name}</button>
      `).join('')}
    </div>
    <button onclick="applyPin()" class="btn-form-primary">Apply Location</button>
  </div>`;
  modal.classList.add('active');
}

function setPin(lat, lng) {
  document.getElementById('pin-lat').value = lat;
  document.getElementById('pin-lng').value = lng;
}

function applyPin() {
  AppState.mapPin.lat = parseFloat(document.getElementById('pin-lat').value);
  AppState.mapPin.lng = parseFloat(document.getElementById('pin-lng').value);
  closeModal();
  renderDashboard();
}

function handleCreativeDrop(e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) loadCreativeFile(file);
}

function handleCreativeUpload(e) {
  const file = e.target.files[0];
  if (file) loadCreativeFile(file);
}

function loadCreativeFile(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    AppState.uploadedCreative = ev.target.result;
    renderDashboard();
  };
  reader.readAsDataURL(file);
}

// Real-time countdown update (called by state machine)
function updateCountdownDisplay(hoardingId) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
  if (!h || !h.holdExpiry) return;
  const remaining = h.holdExpiry - Date.now();
  if (remaining <= 0) return;
  const hrs = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const str = `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const el = document.getElementById(`timer-${hoardingId}`);
  if (el) el.textContent = str;
  // progress bar
  const total = 12 * 3600000;
  const pct = (remaining / total * 100).toFixed(1);
  const pb = document.getElementById(`progress-${hoardingId}`);
  if (pb) { pb.style.width = pct + '%'; pb.style.background = pct > 50 ? '#2ecc71' : pct > 25 ? '#f39c12' : '#e74c3c'; }
}
