// ============================================================
// SPYDEE v3 — Advertiser Dashboard (Real Map + Rich Detail Modal)
// ============================================================

function renderAdvertiserView() {
  const hoardings = AppState.getFilteredHoardings();
  const user = AppState.currentUser;
  const myHolds = SPYDEE_DATA.hoardings.filter(h => h.holdBy === user.id && h.status === 'on-hold');
  const myBookings = SPYDEE_DATA.bookings.filter(b => b.customerId === user.id);

  return `<div class="advertiser-view">
    <div class="split-pane">

      <!-- LEFT: Map + Visualizer -->
      <div class="map-pane">
        <div class="map-toolbar">
          <div class="map-toolbar-left">
            <span class="map-label">🗺 Pune & PCMC</span>
            <span class="map-count" id="map-count">${hoardings.length}/${SPYDEE_DATA.hoardings.length} boards</span>
            <span class="map-hint">Click map · Drag 📍 pin · Adjust radius</span>
          </div>
          <div class="map-toolbar-right">
            <div class="search-bar-mini">
              <input type="text" placeholder="🔍 Search hoardings…"
                     value="${AppState._searchQuery}"
                     oninput="mapSearch(this.value)"
                     class="map-search-input"/>
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
            <p>Upload your ad creative to preview it on any selected hoarding</p>
          </div>
          <div class="viz-drop-zone" id="viz-drop"
               ondragover="event.preventDefault()" ondrop="handleCreativeDrop(event)"
               onclick="document.getElementById('creative-upload').click()">
            ${AppState.uploadedCreative
              ? `<div class="creative-preview-row">
                   <img src="${AppState.uploadedCreative}" style="height:52px;border-radius:4px;border:1px solid var(--border)"/>
                   <div>
                     <div style="font-size:12px;color:var(--green);font-weight:600">✓ Creative uploaded</div>
                     <button onclick="event.stopPropagation();clearCreative()" class="btn-del-creative">🗑 Remove</button>
                   </div>
                 </div>`
              : `<div class="drop-icon">⬆️</div>
                 <p>Drop artwork here or click to upload</p>
                 <span class="drop-hint">PNG · JPG · WebP — any size</span>`}
          </div>
          <input type="file" id="creative-upload" accept="image/*" style="display:none"
                 onchange="handleCreativeUpload(event)"/>
          ${AppState.selectedHoarding && AppState.uploadedCreative ? renderBillboardMockup() : ''}
        </div>
      </div>

      <!-- RIGHT: Filters + Cards -->
      <div class="sidebar-pane">
        <!-- Active Holds -->
        ${myHolds.length > 0 ? `<div class="holds-panel">
          <h4>⏱ Active Holds (${myHolds.length})</h4>
          ${myHolds.map(h => renderHoldBanner(h)).join('')}
        </div>` : ''}

        <!-- Filters -->
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
            <label>Status</label>
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
            <label>Monthly Budget (₹)</label>
            <div class="price-inputs">
              <input type="number" placeholder="Min ₹" value="${AppState.filters.minPrice || ''}"
                     oninput="setFilter('minPrice',this.value||0)" class="price-input"/>
              <span>–</span>
              <input type="number" placeholder="Max ₹"
                     value="${AppState.filters.maxPrice < 999999 ? AppState.filters.maxPrice : ''}"
                     oninput="setFilter('maxPrice',this.value||999999)" class="price-input"/>
            </div>
          </div>
          <div class="filter-section">
            <label>Media Owner</label>
            <select onchange="setFilter('vendor',this.value)" class="filter-select">
              <option value="all">All Vendors</option>
              ${SPYDEE_DATA.users.filter(u => u.role === 'vendor').map(v =>
                `<option value="${v.id}" ${AppState.filters.vendor === v.id ? 'selected' : ''}>${v.name}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <!-- Hoarding Cards -->
        <div class="hoarding-cards" id="hoarding-cards">
          ${hoardings.length === 0
            ? `<div class="empty-state">No hoardings in range.<br>Try clicking the map to repin or expand the radius.</div>`
            : hoardings.map(h => renderHoardingCard(h)).join('')}
        </div>

        <!-- My Bookings -->
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
      _leafletMap.invalidateSize();
      refreshMapMarkers();
      updateMapInfoBar();
    } else {
      _mapInitialized = false;
      initLeafletMap('leaflet-map');
    }
  }, 60);
}

// ── Hoarding Card (compact, click opens detail modal) ─────────
function renderHoardingCard(h) {
  const isHeld = h.status === 'on-hold', isBooked = h.status === 'booked';
  const isMyHold = h.holdBy === AppState.currentUser?.id;
  const isSel = AppState.selectedHoarding?.id === h.id;
  const dist = haversineDistance(AppState.mapPin.lat, AppState.mapPin.lng, h.lat, h.lng);
  const distStr = dist < 1000 ? (dist/1000).toFixed(2)+'km' : dist.toFixed(0)+'m';
  const coverPhoto = h.images?.[0];

  return `<div class="hoarding-card ${isSel ? 'selected' : ''}"
              onclick="showHoardingDetail('${h.id}')">
    <div class="card-image-wrap">
      ${coverPhoto
        ? `<img src="${coverPhoto}" class="card-real-photo" alt="${h.title}"
               style="width:90px;height:100%;min-height:100px;object-fit:cover"/>`
        : `<div class="card-image">
             <div class="billboard-thumb">
               <div class="bb-face ${h.type==='Digital LED'?'bb-digital':h.type==='Backlit'?'bb-backlit':'bb-flex'}"
                    style="width:${Math.min(h.width*1.8,78)}px;height:${Math.min(h.height*1.8,40)}px">
               </div>
               <div class="bb-pole"></div>
             </div>
           </div>`}
      <span class="dist-badge">${distStr}</span>
      ${isBooked ? `<span class="badge-booked">BOOKED</span>`
        : isHeld  ? `<span class="badge-hold">ON HOLD</span>`
                  : `<span class="badge-avail">AVAIL</span>`}
      ${h.verified ? `<span class="badge-verified">✓</span>` : ''}
      ${h.featured  ? `<span class="badge-featured">⭐</span>` : ''}
    </div>
    <div class="card-body">
      <h4 class="card-title">${h.title}</h4>
      <p class="card-location">📍 ${h.location.split(',').slice(0,2).join(',')}</p>
      <div class="card-specs">
        <span class="spec-tag">${h.width}×${h.height}ft</span>
        <span class="spec-tag">${h.type}</span>
        <span class="spec-tag traffic-${(h.traffic||'').toLowerCase().replace(' ','-')}">${h.traffic}</span>
        <span class="spec-tag">👁 ${(h.dailyImpression/1000).toFixed(0)}K/day</span>
      </div>
      ${h.rating > 0 ? `<div class="card-rating">${starsHTML(Math.round(h.rating))} <span style="font-size:11px;color:var(--text-muted)">${h.rating.toFixed(1)} (${h.reviewCount})</span></div>` : ''}
      <div class="card-footer">
        <div class="card-price">
          <span class="price-main">${formatCurrency(h.basePriceMonthly)}</span>
          <span class="price-unit">/mo</span>
        </div>
        <span class="card-view-detail">View Details →</span>
      </div>
    </div>
  </div>`;
}

// ============================================================
// HOARDING DETAIL MODAL — Full info, photos, red-box, booking
// ============================================================
function showHoardingDetail(id) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === id);
  if (!h) return;
  AppState.selectedHoarding = h;
  if (_leafletMap) {
    refreshMapMarkers();
    _leafletMap.flyTo([h.lat, h.lng], 16, { duration: 1 });
  }

  const vendor = SPYDEE_DATA.users.find(u => u.id === h.vendorId);
  const isHeld = h.status === 'on-hold', isBooked = h.status === 'booked';
  const isMyHold = h.holdBy === AppState.currentUser?.id;
  const user = SPYDEE_DATA.users.find(u => u.id === AppState.currentUser?.id);
  const imgs = h.images || [];
  const bookings = SPYDEE_DATA.bookings.filter(b => b.hoardingId === h.id);
  const activeMonths = Object.entries(h.availability || {}).filter(([, v]) => v).map(([k]) => k);
  const statusColor = isBooked ? 'var(--red)' : isHeld ? 'var(--amber)' : 'var(--green)';
  const statusLabel = isBooked ? 'Booked' : isHeld ? 'On Hold' : 'Available';

  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `<div class="modal-card hoarding-detail-modal">
    <button class="modal-close" onclick="closeModal()">✕</button>

    <!-- HEADER -->
    <div class="hd-header">
      <div class="hd-title-block">
        <div class="hd-badges">
          <span class="hd-status-badge" style="background:${statusColor}20;color:${statusColor};border:1px solid ${statusColor}40">
            ● ${statusLabel}
          </span>
          ${h.verified ? '<span class="hd-badge-verified">✓ Admin Verified</span>' : '<span class="hd-badge-pending">⏳ Pending Verification</span>'}
          ${h.featured ? '<span class="hd-badge-featured">⭐ Featured</span>' : ''}
        </div>
        <h2 class="hd-title">${h.title}</h2>
        <p class="hd-location">📍 ${h.location}</p>
        ${h.gmapsLink ? `<a href="${h.gmapsLink}" target="_blank" class="hd-maps-link">🗺 Open in Google Maps</a>` : ''}
      </div>
      <div class="hd-price-block">
        <div class="hd-price">${formatCurrency(h.basePriceMonthly)}</div>
        <div class="hd-price-unit">per month</div>
        ${h.rating > 0 ? `<div class="hd-rating">${starsHTML(Math.round(h.rating))} <span>${h.rating.toFixed(1)} (${h.reviewCount} reviews)</span></div>` : ''}
      </div>
    </div>

    <!-- PHOTO GALLERY with Red Box annotation -->
    ${imgs.length > 0 ? `
    <div class="hd-gallery">
      <div class="hd-gallery-main" id="hd-gallery-main">
        <div class="hd-photo-wrap" id="hd-photo-wrap">
          <img src="${imgs[0]}" class="hd-main-photo" id="hd-main-img" onclick="hd_toggleAnnotation()"/>
          <!-- Red box annotation overlay -->
          ${h.redSquare ? `
          <div class="hd-red-box" id="hd-red-box"
               style="left:${h.redSquare.dx||h.redSquare.x}px;
                      top:${h.redSquare.dy||h.redSquare.y}px;
                      width:${h.redSquare.dw||h.redSquare.w}px;
                      height:${h.redSquare.dh||h.redSquare.h}px">
            <span class="hd-red-box-label">📍 Hoarding</span>
          </div>` : ''}
          <div class="hd-photo-hint" id="hd-photo-hint">Click photo to toggle annotation</div>
        </div>
      </div>
      ${imgs.length > 1 ? `
      <div class="hd-gallery-thumbs">
        ${imgs.map((img, i) => `
          <img src="${img}" class="hd-thumb ${i===0?'hd-thumb-active':''}"
               onclick="hd_switchPhoto(this,'${img}',${i})"
               data-idx="${i}"/>
        `).join('')}
      </div>` : ''}
    </div>` : `
    <div class="hd-no-photo">
      <div class="bb-face ${h.type==='Digital LED'?'bb-digital':h.type==='Backlit'?'bb-backlit':'bb-flex'}"
           style="width:120px;height:60px;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--text-muted)">
        ${h.width}×${h.height}ft
      </div>
      <p style="color:var(--text-dim);font-size:13px;margin-top:12px">No site photos uploaded yet</p>
    </div>`}

    <!-- SPECS GRID -->
    <div class="hd-specs-grid">
      <div class="hd-spec-item">
        <div class="hd-spec-icon">📐</div>
        <div class="hd-spec-content">
          <div class="hd-spec-label">Dimensions</div>
          <div class="hd-spec-value">${h.width} × ${h.height} ft (${h.orientation})</div>
        </div>
      </div>
      <div class="hd-spec-item">
        <div class="hd-spec-icon">🏷</div>
        <div class="hd-spec-content">
          <div class="hd-spec-label">Board Type</div>
          <div class="hd-spec-value">${h.type}</div>
        </div>
      </div>
      <div class="hd-spec-item">
        <div class="hd-spec-icon">🚦</div>
        <div class="hd-spec-content">
          <div class="hd-spec-label">Traffic</div>
          <div class="hd-spec-value">${h.traffic}</div>
        </div>
      </div>
      <div class="hd-spec-item">
        <div class="hd-spec-icon">👁</div>
        <div class="hd-spec-content">
          <div class="hd-spec-label">Daily Impressions</div>
          <div class="hd-spec-value">${h.dailyImpression.toLocaleString('en-IN')}</div>
        </div>
      </div>
      <div class="hd-spec-item">
        <div class="hd-spec-icon">💡</div>
        <div class="hd-spec-content">
          <div class="hd-spec-label">Illumination</div>
          <div class="hd-spec-value">${h.illumination || '—'}</div>
        </div>
      </div>
      <div class="hd-spec-item">
        <div class="hd-spec-icon">🧵</div>
        <div class="hd-spec-content">
          <div class="hd-spec-label">Material</div>
          <div class="hd-spec-value">${h.material || '—'}</div>
        </div>
      </div>
      <div class="hd-spec-item">
        <div class="hd-spec-icon">🖨</div>
        <div class="hd-spec-content">
          <div class="hd-spec-label">Print Spec</div>
          <div class="hd-spec-value">${h.printSpec || '—'}</div>
        </div>
      </div>
      <div class="hd-spec-item">
        <div class="hd-spec-icon">🏢</div>
        <div class="hd-spec-content">
          <div class="hd-spec-label">Media Owner</div>
          <div class="hd-spec-value">${vendor?.name || '—'}${vendor?.company ? '<br><small style="color:var(--text-dim)">'+vendor.company+'</small>' : ''}</div>
        </div>
      </div>
    </div>

    <!-- AVAILABILITY CALENDAR -->
    <div class="hd-availability">
      <h4>📅 Availability</h4>
      <div class="hd-month-grid">
        ${['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03'].map(m => {
          const booked = SPYDEE_DATA.bookings.find(b => b.hoardingId===h.id && b.month===m && b.status==='confirmed');
          const avail = h.availability?.[m];
          const cls = booked ? 'hd-month-booked' : avail ? 'hd-month-open' : 'hd-month-closed';
          const lbl = booked ? 'Booked' : avail ? 'Open' : 'Closed';
          return `<div class="hd-month-cell ${cls}">
            <div class="hd-month-name">${m.slice(5)} ${m.slice(0,4)}</div>
            <div class="hd-month-status">${lbl}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- REVIEWS -->
    ${bookings.some(b => b.rating) ? `
    <div class="hd-reviews">
      <h4>⭐ Customer Reviews</h4>
      <div class="hd-reviews-list">
        ${bookings.filter(b => b.rating).map(b => {
          const c = SPYDEE_DATA.users.find(u => u.id === b.customerId);
          return `<div class="hd-review-item">
            <div class="hd-review-header">
              <div class="hd-reviewer-avatar">${c?.name?.charAt(0)||'?'}</div>
              <div>
                <strong>${c?.name||'Anonymous'}</strong>
                <div>${starsHTML(b.rating)} <span style="font-size:11px;color:var(--text-muted)">${b.ratingDate||''}</span></div>
              </div>
            </div>
            ${b.review ? `<p class="hd-review-text">"${b.review}"</p>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    <!-- MOCKUP PREVIEW if creative loaded -->
    ${AppState.uploadedCreative ? `
    <div class="hd-mockup-section">
      <h4>🎨 Your Creative Mockup</h4>
      ${renderBillboardMockup()}
    </div>` : `
    <div class="hd-mockup-cta">
      <span>🎨</span>
      <span>Upload your artwork in the visualizer to preview it on this hoarding</span>
    </div>`}

    <!-- BOOKING ACTION -->
    <div class="hd-booking-action">
      <div class="hd-wallet-row">
        <span>Your Wallet:</span>
        <strong style="color:var(--green)">${formatCurrency(user?.wallet || 0)}</strong>
        <span style="color:var(--text-dim);font-size:12px">· 10% deposit = ${formatCurrency(Math.round(h.basePriceMonthly * 0.1))}</span>
      </div>
      ${!isBooked && !isHeld
        ? `<button onclick="closeModal();handleReserve('${h.id}')" class="hd-reserve-btn">
             🔒 Reserve Now (${formatCurrency(Math.round(h.basePriceMonthly * 0.1))} deposit)
           </button>
           <p class="hd-book-note">12-hour hold · Full refund if cancelled before expiry · 50% refund after booking</p>`
        : isMyHold
          ? `<button onclick="closeModal();showConfirmBookingModal('${h.id}')" class="hd-book-btn">
               ✅ Confirm Booking
             </button>
             <button onclick="closeModal();handleCancelHold('${h.id}')" class="hd-cancel-hold-btn">
               ↩ Cancel Hold (Full Refund)
             </button>`
          : `<div class="hd-unavail">
               <span>⛔ This hoarding is currently ${statusLabel.toLowerCase()}.</span>
             </div>`}
    </div>
  </div>`;
  modal.classList.add('active');
}

// Gallery helpers
let _hdAnnotationVisible = true;
function hd_switchPhoto(el, src, idx) {
  const mainImg = document.getElementById('hd-main-img');
  const redBox = document.getElementById('hd-red-box');
  if (mainImg) mainImg.src = src;
  // Highlight active thumb
  document.querySelectorAll('.hd-thumb').forEach(t => t.classList.remove('hd-thumb-active'));
  el.classList.add('hd-thumb-active');
  _hdAnnotationVisible = true;
  if (redBox) redBox.style.opacity = '1';
}
function hd_toggleAnnotation() {
  const redBox = document.getElementById('hd-red-box');
  if (!redBox) return;
  _hdAnnotationVisible = !_hdAnnotationVisible;
  redBox.style.opacity = _hdAnnotationVisible ? '1' : '0';
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
      <strong>${h.title.split(' ').slice(0,3).join(' ')}</strong>
      <span class="hold-timer" id="timer-${h.id}">${hrs}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}</span>
    </div>
    <div class="hcb-prog-wrap">
      <div class="hcb-progress" id="progress-${h.id}"
           style="width:${pct}%;background:${pct>50?'var(--green)':pct>25?'var(--amber)':'var(--red)'}">
      </div>
    </div>
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
      <strong onclick="showHoardingDetail('${b.hoardingId}')" style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px">${h?.title || b.hoardingId}</strong>
      <span class="status-badge status-${b.status==='confirmed'?'confirmed':b.status==='cancelled'?'cancelled':'hold'}">${b.status}</span>
    </div>
    <div class="bmc-details">${b.month} × ${b.durationMonths||1}mo · ${formatCurrency(b.totalDue)}</div>
    ${b.status === 'confirmed' ? `<div class="bmc-actions">
      ${!b.printJob
        ? `<button onclick="handleCreatePrintJob('${b.id}')" class="btn-xs-primary">🖨 Order Print</button>`
        : `<span class="print-badge">🖨 ${pj?.status||'ordered'}</span>
           ${pj && !pj.artworkUrl && pj.status!=='dispatched' ? `<button onclick="uploadArtworkForJob('${b.printJob}')" class="btn-xs-primary">📤 Art</button>` : ''}
           ${pj?.artworkUrl ? `<button onclick="deleteJobArtwork('${b.printJob}')" class="btn-xs" style="color:var(--red)">🗑</button>` : ''}`}
      ${!b.rating ? `<button onclick="showRatingModal('${b.id}')" class="btn-xs">⭐ Rate</button>` : `<span style="color:var(--amber);font-size:13px">${'★'.repeat(b.rating)}</span>`}
      <button onclick="showCancelBookingModal('${b.id}')" class="btn-xs" style="color:var(--red)">Cancel</button>
    </div>` : ''}
  </div>`;
}

// ── Billboard Mockup ──────────────────────────────────────────
function renderBillboardMockup() {
  const h = AppState.selectedHoarding;
  if (!h || !AppState.uploadedCreative) return '';
  const aspect = (h.width||20) / (h.height||10);
  const mw = 240, mh = Math.min(Math.round(mw / aspect), 180);
  return `<div class="billboard-mockup-wrap">
    <h5>📐 ${h.title.split(' ').slice(0,3).join(' ')} · ${h.width}×${h.height}ft</h5>
    <div class="billboard-scene">
      <div class="billboard-perspective" style="width:${mw}px;height:${mh}px">
        <img src="${AppState.uploadedCreative}" class="billboard-creative"/>
      </div>
      <div class="billboard-support"><div class="support-pole"></div><div class="support-base"></div></div>
    </div>
    <p class="mockup-hint">☀️ Day view simulation</p>
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
      <span>${h.location.split(',').slice(0,2).join(',')}</span>
      <span>${h.width}×${h.height}ft · ${h.type} · ${h.traffic} Traffic</span>
    </div>
    <div class="form-row" style="margin-bottom:16px">
      <div class="form-group">
        <label>Campaign Month</label>
        <select id="booking-month" class="filter-select">
          ${['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12',
             '2026-01','2026-02','2026-03'].map(m => `<option>${m}</option>`).join('')}
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
      Wallet Balance: <strong style="color:var(--green)">${formatCurrency(user?.wallet || 0)}</strong>
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
    <div class="inv-row"><span>Base Price (${duration} × ${formatCurrency(baseMonthly)})</span><span>${formatCurrency(base)}</span></div>
    <div class="inv-row"><span>CGST @ 9%</span><span>${formatCurrency(Math.round(gst/2))}</span></div>
    <div class="inv-row"><span>SGST @ 9%</span><span>${formatCurrency(Math.round(gst/2))}</span></div>
    <div class="inv-row inv-sub"><span>Gross Total</span><span>${formatCurrency(base+gst)}</span></div>
    <div class="inv-row inv-credit"><span>Less: 10% Deposit Paid</span><span>–${formatCurrency(deposit)}</span></div>
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
    <p style="color:var(--text-muted);font-size:13px;margin-bottom:12px">How was your experience?</p>
    <div class="star-rating">${[1,2,3,4,5].map(i=>`<span class="star" onclick="setRating(${i})" data-v="${i}">☆</span>`).join('')}</div>
    <input type="hidden" id="rating-val" value="0"/>
    <div class="form-group" style="margin-top:16px;text-align:left">
      <label>Review (optional)</label>
      <textarea id="review-text" rows="3" placeholder="Great visibility, smooth experience…"
                style="width:100%;background:var(--bg-surface);border:1px solid var(--border);color:var(--text);padding:10px;border-radius:6px;resize:vertical;font-family:var(--font-body)"></textarea>
    </div>
    <button onclick="submitRating('${bookingId}')" class="btn-form-primary">Submit Rating</button>
  </div>`;
  modal.classList.add('active');
}
function setRating(val) {
  document.getElementById('rating-val').value = val;
  document.querySelectorAll('.star').forEach((s,i) => {
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
  const refund = Math.round((b?.totalDue||0) * 0.5);
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `<div class="modal-card" style="max-width:400px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>❗ Cancel Booking</h3>
    <p style="color:var(--text-muted);margin:14px 0">
      You'll receive a <strong style="color:var(--amber)">50% refund</strong> of
      <strong>${formatCurrency(refund)}</strong> back to your wallet.
    </p>
    <div class="modal-actions">
      <button onclick="handleCancelBookingConfirm('${bookingId}')" class="btn-form-primary" style="background:var(--red)">Confirm Cancellation</button>
      <button onclick="closeModal()" class="btn-ghost">Keep Booking</button>
    </div>
  </div>`;
  modal.classList.add('active');
}
function handleCancelBookingConfirm(bookingId) {
  const result = AppState.cancelBooking(bookingId);
  if (result.ok) { closeModal(); showToast(`Cancelled. ${formatCurrency(result.refund)} refunded.`, 'success'); renderDashboard(); }
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

// ── Core Handlers ─────────────────────────────────────────────
function selectHoarding(id) {
  AppState.selectedHoarding = SPYDEE_DATA.hoardings.find(h => h.id === id);
  AppState.save();
  refreshSidebarCards();
  if (_leafletMap) refreshMapMarkers();
  setTimeout(() => document.querySelector('.hoarding-card.selected')?.scrollIntoView({behavior:'smooth',block:'nearest'}), 80);
}

function handleReserve(id) {
  const result = AppState.reserveHoarding(id);
  if (result.ok) { showToast(`🔒 Reserved! ${formatCurrency(result.deposit)} deposit deducted. 12-hour hold.`, 'success'); renderDashboard(); }
  else showToast(result.msg, 'error');
}

function handleCancelHold(id) {
  const result = AppState.cancelHold(id);
  if (result.ok) { showToast(`✅ Hold cancelled. ${formatCurrency(result.refund)} refunded to wallet!`, 'success'); renderDashboard(); }
  else showToast(result.msg, 'error');
}

function handleConfirmBooking(hoardingId) {
  const month = document.getElementById('booking-month')?.value || '2025-07';
  const dur = parseInt(document.getElementById('booking-duration')?.value || 1);
  const result = AppState.confirmBooking(hoardingId, month, dur);
  if (result.ok) { closeModal(); showToast(`🎉 Booking confirmed! ${formatCurrency(result.invoice.totalDue)} charged.`, 'success'); renderDashboard(); }
  else showToast(result.msg, 'error');
}

function handleCreatePrintJob(bookingId) {
  const result = AppState.createPrintJob(bookingId);
  if (result.ok) { showToast('🖨 Print job created!', 'success'); renderDashboard(); }
  else showToast(result.msg || 'Failed.', 'error');
}

function setFilter(k, v) {
  AppState.filters[k] = (k === 'minPrice' || k === 'maxPrice') ? Number(v) : v;
  refreshSidebarCards();
  if (_leafletMap) refreshMapMarkers();
}

function clearAllFilters() {
  AppState.filters = { type:'all', minPrice:0, maxPrice:999999, vendor:'all', status:'all', traffic:'all' };
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
  const hrs = Math.floor(rem/3600000), mins = Math.floor((rem%3600000)/60000), secs = Math.floor((rem%60000)/1000);
  const str = `${hrs}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  document.querySelectorAll(`#timer-${hId}`).forEach(el => el.textContent = str);
  const pct = rem / (12*3600000) * 100;
  document.querySelectorAll(`#progress-${hId}`).forEach(el => {
    el.style.width = pct + '%';
    el.style.background = pct > 50 ? 'var(--green)' : pct > 25 ? 'var(--amber)' : 'var(--red)';
  });
}
