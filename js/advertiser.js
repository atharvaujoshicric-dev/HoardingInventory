// ============================================================
// SPYDEE v3.2 — Advertiser Dashboard
// Fixes: contact loophole, rating guard, sort, compare, enquiry, waitlist, messaging
// ============================================================

function renderAdvertiserView() {
  const hoardings = AppState.getFilteredHoardings();
  const user = AppState.currentUser;
  const myHolds = SPYDEE_DATA.hoardings.filter(h => h.holdBy === user.id && h.status === 'on-hold');
  const myBookings = SPYDEE_DATA.bookings.filter(b => b.customerId === user.id);
  const myEnquiries = AppState.getMyEnquiries();
  const unreadMsgs = AppState.getUnreadMessageCount();

  return `<div class="advertiser-view">
    <div class="split-pane">
      <div class="map-pane">
        <div class="map-toolbar">
          <div class="map-toolbar-left">
            <span class="map-label">🗺 Pune & PCMC</span>
            <span class="map-count" id="map-count">${hoardings.length}/${SPYDEE_DATA.hoardings.filter(h=>h.verified).length} boards</span>
            <span class="map-hint">Click map · Drag 📍 pin</span>
          </div>
          <div class="map-toolbar-right">
            <input type="text" placeholder="🔍 Search…" value="${AppState._searchQuery}"
                   oninput="mapSearch(this.value)" class="map-search-input"/>
            ${AppState.compareList.length > 0
              ? `<button onclick="showCompareModal()" class="btn-compare-active">⚖ Compare (${AppState.compareList.length})</button>`
              : ''}
          </div>
        </div>
        <div id="leaflet-map" style="width:100%;height:420px;z-index:1;"></div>
        <div class="map-info-bar" id="map-info-bar">
          📍 ${AppState.mapPin.lat.toFixed(4)}, ${AppState.mapPin.lng.toFixed(4)}
          &nbsp;|&nbsp; ⭕ <strong>${AppState.radiusKm}km</strong>
          &nbsp;|&nbsp; ${hoardings.length} in range
          ${unreadMsgs > 0 ? `&nbsp;|&nbsp; <span style="color:var(--amber);font-weight:700">💬 ${unreadMsgs} unread message${unreadMsgs>1?'s':''}</span>` : ''}
        </div>
        <div class="creative-visualizer">
          <div class="viz-header">
            <h4>🎨 Creative Mockup Visualizer</h4>
            <p>Upload your artwork · Select a hoarding · Preview it live</p>
          </div>
          <div class="viz-drop-zone" ondragover="event.preventDefault()" ondrop="handleCreativeDrop(event)"
               onclick="document.getElementById('creative-upload').click()">
            ${AppState.uploadedCreative
              ? `<div class="creative-preview-row">
                   <img src="${AppState.uploadedCreative}" style="height:52px;border-radius:4px;border:1px solid var(--border)"/>
                   <div><div style="font-size:12px;color:var(--green);font-weight:600">✓ Creative loaded</div>
                   <button onclick="event.stopPropagation();clearCreative()" class="btn-del-creative">🗑 Remove</button></div>
                 </div>`
              : `<div class="drop-icon">⬆️</div><p>Drop or click to upload artwork</p><span class="drop-hint">PNG · JPG · WebP</span>`}
          </div>
          <input type="file" id="creative-upload" accept="image/*" style="display:none" onchange="handleCreativeUpload(event)"/>
          ${AppState.selectedHoarding && AppState.uploadedCreative ? renderBillboardMockup() : ''}
        </div>
      </div>

      <div class="sidebar-pane">
        <!-- Holds -->
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
            <label>Radius: <strong id="radius-val">${AppState.radiusKm}km</strong></label>
            <input type="range" min="0.5" max="15" step="0.5" value="${AppState.radiusKm}"
                   oninput="syncRadiusSlider(this.value)" class="range-input"/>
            <div class="range-labels"><span>500m</span><span>15km</span></div>
          </div>
          <div class="filter-section">
            <label>Sort By</label>
            <div class="filter-chips">
              ${[['distance','📍 Nearest'],['price-asc','₹ Low–High'],['price-desc','₹ High–Low'],['impressions','👁 Impressions'],['rating','⭐ Rating']].map(([v,l]) =>
                `<button class="chip ${AppState.filters.sort===v?'active':''}" onclick="setFilter('sort','${v}')">${l}</button>`).join('')}
            </div>
          </div>
          <div class="filter-section">
            <label>Type</label>
            <div class="filter-chips">
              ${['all','Backlit','Digital LED','Flex'].map(t =>
                `<button class="chip ${AppState.filters.type===t?'active':''}" onclick="setFilter('type','${t}')">${t==='all'?'All':t}</button>`).join('')}
            </div>
          </div>
          <div class="filter-section">
            <label>Traffic</label>
            <div class="filter-chips">
              ${['all','Low','Medium','High','Very High'].map(t =>
                `<button class="chip ${AppState.filters.traffic===t?'active':''}" onclick="setFilter('traffic','${t}')">${t==='all'?'All':t}</button>`).join('')}
            </div>
          </div>
          <div class="filter-section">
            <label>Status</label>
            <div class="filter-chips">
              ${['all','available','on-hold','booked'].map(s =>
                `<button class="chip ${AppState.filters.status===s?'active':''}" onclick="setFilter('status','${s}')">${s==='all'?'All':s}</button>`).join('')}
            </div>
          </div>
          <div class="filter-section">
            <label>Budget / Month (₹)</label>
            <div class="price-inputs">
              <input type="number" placeholder="Min" value="${AppState.filters.minPrice||''}"
                     oninput="setFilter('minPrice',this.value||0)" class="price-input"/>
              <span>–</span>
              <input type="number" placeholder="Max" value="${AppState.filters.maxPrice<999999?AppState.filters.maxPrice:''}"
                     oninput="setFilter('maxPrice',this.value||999999)" class="price-input"/>
            </div>
          </div>
        </div>

        <!-- Cards -->
        <div class="hoarding-cards" id="hoarding-cards">
          ${hoardings.length === 0
            ? `<div class="empty-state">No verified hoardings in range.<br>Try expanding radius or changing filters.</div>`
            : hoardings.map(h => renderHoardingCard(h)).join('')}
        </div>

        <!-- Enquiries Panel -->
        ${myEnquiries.length > 0 ? `<div class="my-bookings">
          <h4>❓ My Enquiries</h4>
          ${myEnquiries.map(e => {
            const h = SPYDEE_DATA.hoardings.find(x => x.id === e.hoardingId);
            return `<div class="booking-mini-card">
              <div class="bmc-info">
                <strong style="cursor:pointer;text-decoration:underline dotted" onclick="showHoardingDetail('${e.hoardingId}')">${h?.title||e.hoardingId}</strong>
                <span class="status-badge status-${e.status==='replied'?'confirmed':'hold'}">${e.status}</span>
              </div>
              <div class="bmc-details" style="font-size:12px;color:var(--text-muted)">"${e.text.slice(0,60)}…"</div>
              ${e.reply ? `<div style="background:var(--green-soft);border:1px solid rgba(46,204,113,0.2);border-radius:6px;padding:8px;font-size:12px;margin-top:6px;color:var(--text)">
                <span style="font-size:10px;color:var(--green);font-weight:700">VENDOR REPLY:</span><br>${e.reply}
              </div>` : `<div style="font-size:11px;color:var(--text-dim);margin-top:4px">Awaiting vendor reply…</div>`}
            </div>`;
          }).join('')}
        </div>` : ''}

        <!-- My Campaigns -->
        ${myBookings.length > 0 ? `<div class="my-bookings">
          <h4>📋 My Campaigns</h4>
          ${myBookings.map(b => renderMyBookingCard(b)).join('')}
        </div>` : ''}
      </div>
    </div>
  </div>`;
}

function afterAdvertiserRender() {
  const el = document.getElementById('leaflet-map');
  if (!el) return;
  setTimeout(() => {
    if (_mapInitialized && _leafletMap && document.getElementById('leaflet-map')) {
      _leafletMap.invalidateSize(); refreshMapMarkers(); updateMapInfoBar();
    } else { _mapInitialized = false; initLeafletMap('leaflet-map'); }
  }, 60);
}

// ── Hoarding Card ─────────────────────────────────────────────
function renderHoardingCard(h) {
  const isHeld = h.status === 'on-hold', isBooked = h.status === 'booked';
  const isMyHold = h.holdBy === AppState.currentUser?.id;
  const isSel = AppState.selectedHoarding?.id === h.id;
  const inCompare = AppState.compareList.includes(h.id);
  const dist = haversineDistance(AppState.mapPin.lat, AppState.mapPin.lng, h.lat, h.lng);
  const distStr = dist < 1000 ? (dist/1000).toFixed(2)+'km' : dist.toFixed(0)+'m';
  const coverPhoto = h.images?.[0];

  return `<div class="hoarding-card ${isSel?'selected':''}" onclick="showHoardingDetail('${h.id}')">
    <div class="card-image-wrap">
      ${coverPhoto
        ? `<img src="${coverPhoto}" style="width:90px;min-height:100px;height:100%;object-fit:cover" alt="${h.title}"/>`
        : `<div class="card-image"><div class="billboard-thumb">
             <div class="bb-face ${h.type==='Digital LED'?'bb-digital':h.type==='Backlit'?'bb-backlit':'bb-flex'}"
                  style="width:${Math.min(h.width*1.8,78)}px;height:${Math.min(h.height*1.8,40)}px"></div>
             <div class="bb-pole"></div></div></div>`}
      <span class="dist-badge">${distStr}</span>
      ${isBooked?`<span class="badge-booked">BOOKED</span>`:isHeld?`<span class="badge-hold">HELD</span>`:`<span class="badge-avail">AVAIL</span>`}
      ${h.verified?`<span class="badge-verified">✓</span>`:''}
      ${h.featured?`<span class="badge-featured">⭐</span>`:''}
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
      ${h.rating>0 ? `<div class="card-rating">${starsHTML(Math.round(h.rating))} <span style="font-size:11px;color:var(--text-muted)">${h.rating.toFixed(1)} (${h.reviewCount})</span></div>` : ''}
      <div class="card-footer">
        <div class="card-price"><span class="price-main">${formatCurrency(h.basePriceMonthly)}</span><span class="price-unit">/mo</span></div>
        <div style="display:flex;gap:6px;align-items:center">
          <button onclick="event.stopPropagation();toggleCompareCard('${h.id}')"
                  class="btn-compare ${inCompare?'btn-compare-on':''}" title="Compare">
            ${inCompare?'✓':'⚖'}
          </button>
          <span class="card-view-detail">Details →</span>
        </div>
      </div>
    </div>
  </div>`;
}

function toggleCompareCard(hId) {
  const added = AppState.toggleCompare(hId);
  refreshSidebarCards();
  if (_leafletMap) refreshMapMarkers();
  // Update compare button in toolbar
  const mapBar = document.querySelector('.map-toolbar-right');
  if (mapBar) {
    const existing = mapBar.querySelector('.btn-compare-active');
    if (AppState.compareList.length > 0) {
      if (existing) existing.textContent = `⚖ Compare (${AppState.compareList.length})`;
      else mapBar.insertAdjacentHTML('beforeend', `<button onclick="showCompareModal()" class="btn-compare-active">⚖ Compare (${AppState.compareList.length})</button>`);
    } else if (existing) existing.remove();
  }
}

// ── Hold Banner ───────────────────────────────────────────────
function renderHoldBanner(h) {
  const rem = Math.max(0, h.holdExpiry - Date.now());
  const hrs = Math.floor(rem/3600000);
  const mins = Math.floor((rem%3600000)/60000);
  const secs = Math.floor((rem%60000)/1000);
  const pct = rem / (12*3600000) * 100;
  return `<div class="hold-card">
    <div class="hold-info">
      <strong>${h.title.split(' ').slice(0,3).join(' ')}</strong>
      <span class="hold-timer" id="timer-${h.id}">${hrs}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}</span>
    </div>
    <div class="hcb-prog-wrap"><div class="hcb-progress" id="progress-${h.id}"
         style="width:${pct}%;background:${pct>50?'var(--green)':pct>25?'var(--amber)':'var(--red)'}"></div></div>
    <div class="hold-actions">
      <button onclick="handleCancelHold('${h.id}')" class="btn-cancel-hold">↩ Cancel & Full Refund</button>
      <button onclick="showConfirmBookingModal('${h.id}')" class="btn-confirm-hold">✅ Book Now</button>
    </div>
  </div>`;
}

// ── My Booking Card ───────────────────────────────────────────
function renderMyBookingCard(b) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === b.hoardingId);
  const pj = b.printJob ? SPYDEE_DATA.printJobs.find(j => j.id === b.printJob) : null;
  const msgs = AppState.getConversation(b.id);
  const unread = msgs.filter(m => m.toId === AppState.currentUser.id && !m.read).length;
  return `<div class="booking-mini-card">
    <div class="bmc-info">
      <strong onclick="showHoardingDetail('${b.hoardingId}')" style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px">${h?.title||b.hoardingId}</strong>
      <span class="status-badge status-${b.status==='confirmed'?'confirmed':b.status==='cancelled'?'cancelled':'hold'}">${b.status}</span>
    </div>
    <div class="bmc-details">${b.month} × ${b.durationMonths||1}mo · ${formatCurrency(b.totalPaid||b.totalDue||0)}</div>
    ${b.status==='confirmed' ? `<div class="bmc-actions">
      ${!b.printJob
        ? `<button onclick="showPrintJobPreview('${b.id}')" class="btn-xs-primary">🖨 Order Print</button>`
        : `<span class="print-badge">🖨 ${pj?.status||'ordered'}</span>
           ${pj && !pj.artworkUrl && pj.status!=='dispatched' ? `<button onclick="uploadArtworkForJob('${b.printJob}')" class="btn-xs-primary">📤 Art</button>` : ''}
           ${pj?.artworkUrl ? `<button onclick="deleteJobArtwork('${b.printJob}')" class="btn-xs" style="color:var(--red)">🗑</button>` : ''}`}
      <button onclick="showConversation('${b.id}')" class="btn-xs ${unread>0?'btn-xs-primary':''}"
              style="${unread>0?'':''}">💬${unread>0?` ${unread}`:''}</button>
      ${!b.ratedAt ? `<button onclick="showRatingModal('${b.id}')" class="btn-xs">⭐ Rate</button>` : `<span style="color:var(--amber);font-size:13px">${'★'.repeat(b.rating)}</span>`}
      ${b.status==='confirmed' && !(pj?.status==='dispatched') ? `<button onclick="showCancelBookingModal('${b.id}')" class="btn-xs" style="color:var(--red)">Cancel</button>` : ''}
    </div>` : ''}
  </div>`;
}

// ============================================================
// HOARDING DETAIL MODAL — Full info + contact logic + enquiry + waitlist
// ============================================================
function showHoardingDetail(id) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === id);
  if (!h) return;
  AppState.selectedHoarding = h;
  AppState.trackView(id);
  if (_leafletMap) { refreshMapMarkers(); _leafletMap.flyTo([h.lat, h.lng], 16, {duration:1}); }

  const vendor = SPYDEE_DATA.users.find(u => u.id === h.vendorId);
  const user = SPYDEE_DATA.users.find(u => u.id === AppState.currentUser?.id);
  const isHeld = h.status === 'on-hold', isBooked = h.status === 'booked';
  const isMyHold = h.holdBy === AppState.currentUser?.id;
  const myBookingForThis = SPYDEE_DATA.bookings.find(b =>
    b.hoardingId === id && b.customerId === AppState.currentUser?.id && b.status === 'confirmed');
  const imgs = h.images || [];
  const bookingRatings = SPYDEE_DATA.bookings.filter(b => b.hoardingId === id && b.rating);
  const onWaitlist = SPYDEE_DATA.waitlists.some(w => w.hoardingId===id && w.customerId===AppState.currentUser?.id);
  const myEnquiry = SPYDEE_DATA.enquiries.find(e => e.hoardingId===id && e.customerId===AppState.currentUser?.id && e.status!=='closed');
  const statusColor = isBooked?'var(--red)':isHeld?'var(--amber)':'var(--green)';
  const statusLabel = isBooked?'Booked':isHeld?'On Hold':'Available';

  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `<div class="modal-card hoarding-detail-modal">
    <button class="modal-close" onclick="closeModal()">✕</button>

    <!-- HEADER -->
    <div class="hd-header">
      <div class="hd-title-block">
        <div class="hd-badges">
          <span class="hd-status-badge" style="background:${statusColor}20;color:${statusColor};border:1px solid ${statusColor}40">● ${statusLabel}</span>
          ${h.verified?'<span class="hd-badge-verified">✓ Verified</span>':'<span class="hd-badge-pending">⏳ Pending</span>'}
          ${h.featured?'<span class="hd-badge-featured">⭐ Featured</span>':''}
        </div>
        <h2 class="hd-title">${h.title}</h2>
        <p class="hd-location">📍 ${h.location}</p>
        ${h.gmapsLink?`<a href="${h.gmapsLink}" target="_blank" class="hd-maps-link">🗺 Open in Google Maps</a>`:''}
      </div>
      <div class="hd-price-block">
        <div class="hd-price">${formatCurrency(h.basePriceMonthly)}</div>
        <div class="hd-price-unit">per month + 18% GST</div>
        ${h.rating>0?`<div class="hd-rating">${starsHTML(Math.round(h.rating))} <span>${h.rating.toFixed(1)} (${h.reviewCount})</span></div>`:''}
        <div style="font-size:11px;color:var(--text-dim);margin-top:4px">👁 ${h.viewCount||0} views · 🔒 ${h.holdAttempts||0} holds</div>
      </div>
    </div>

    <!-- PHOTO GALLERY -->
    ${imgs.length > 0 ? `
    <div class="hd-gallery">
      <div class="hd-photo-wrap">
        <img src="${imgs[0]}" class="hd-main-photo" id="hd-main-img" onclick="hd_toggleAnnotation()"/>
        ${h.redSquare ? `
        <div class="hd-red-box" id="hd-red-box"
             style="left:${h.redSquare.dx||h.redSquare.x}px;top:${h.redSquare.dy||h.redSquare.y}px;
                    width:${h.redSquare.dw||h.redSquare.w}px;height:${h.redSquare.dh||h.redSquare.h}px">
          <span class="hd-red-box-label">📍 Hoarding</span>
        </div>` : ''}
        <div class="hd-photo-hint" id="hd-photo-hint">Click to toggle annotation</div>
      </div>
      ${imgs.length > 1 ? `<div class="hd-gallery-thumbs">
        ${imgs.map((img,i) => `<img src="${img}" class="hd-thumb ${i===0?'hd-thumb-active':''}"
             onclick="hd_switchPhoto(this,'${img}',${i})" data-idx="${i}"/>`).join('')}
      </div>` : ''}
    </div>` : `
    <div class="hd-no-photo">
      <div class="bb-face ${h.type==='Digital LED'?'bb-digital':h.type==='Backlit'?'bb-backlit':'bb-flex'}"
           style="width:120px;height:60px;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--text-muted)">
        ${h.width}×${h.height}ft
      </div>
      <p style="color:var(--text-dim);font-size:13px;margin-top:12px">No site photos uploaded yet</p>
    </div>`}

    <!-- SPECS -->
    <div class="hd-specs-grid">
      <div class="hd-spec-item"><div class="hd-spec-icon">📐</div><div class="hd-spec-content"><div class="hd-spec-label">Dimensions</div><div class="hd-spec-value">${h.width} × ${h.height} ft (${h.orientation})</div></div></div>
      <div class="hd-spec-item"><div class="hd-spec-icon">🏷</div><div class="hd-spec-content"><div class="hd-spec-label">Board Type</div><div class="hd-spec-value">${h.type}</div></div></div>
      <div class="hd-spec-item"><div class="hd-spec-icon">🚦</div><div class="hd-spec-content"><div class="hd-spec-label">Traffic Level</div><div class="hd-spec-value">${h.traffic}</div></div></div>
      <div class="hd-spec-item"><div class="hd-spec-icon">👁</div><div class="hd-spec-content"><div class="hd-spec-label">Daily Impressions</div><div class="hd-spec-value">${h.dailyImpression.toLocaleString('en-IN')}</div></div></div>
      <div class="hd-spec-item"><div class="hd-spec-icon">💡</div><div class="hd-spec-content"><div class="hd-spec-label">Illumination</div><div class="hd-spec-value">${h.illumination||'—'}</div></div></div>
      <div class="hd-spec-item"><div class="hd-spec-icon">🧵</div><div class="hd-spec-content"><div class="hd-spec-label">Material</div><div class="hd-spec-value">${h.material||'—'}</div></div></div>
      <div class="hd-spec-item"><div class="hd-spec-icon">🖨</div><div class="hd-spec-content"><div class="hd-spec-label">Print Spec</div><div class="hd-spec-value">${h.printSpec||'—'}</div></div></div>
      <div class="hd-spec-item"><div class="hd-spec-icon">🏢</div><div class="hd-spec-content"><div class="hd-spec-label">Media Owner</div><div class="hd-spec-value">${vendor?.company||vendor?.name||'—'}</div></div></div>
    </div>

    <!-- AVAILABILITY -->
    <div class="hd-availability">
      <h4>📅 Availability</h4>
      <div class="hd-month-grid">
        ${['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03'].map(m => {
          const booked = SPYDEE_DATA.bookings.find(b => b.hoardingId===h.id && b.month===m && b.status==='confirmed');
          const avail = h.availability?.[m];
          const cls = booked?'hd-month-booked':avail?'hd-month-open':'hd-month-closed';
          const onWL = SPYDEE_DATA.waitlists.some(w=>w.hoardingId===id&&w.customerId===AppState.currentUser?.id&&w.month===m);
          return `<div class="hd-month-cell ${cls}" onclick="${booked&&!onWL?`addWaitlist('${id}','${m}')`:''}" title="${booked&&!onWL?'Click to join waitlist':''}">
            <div class="hd-month-name">${m.slice(5)} ${m.slice(0,4).slice(2)}</div>
            <div class="hd-month-status">${booked?'Booked':avail?'Open':'Closed'}</div>
            ${booked&&!onWL?'<div class="hd-month-wl">+ Waitlist</div>':''}
            ${onWL?'<div class="hd-month-wl" style="color:var(--amber)">✓ Waiting</div>':''}
          </div>`;
        }).join('')}
      </div>
      <p style="font-size:11px;color:var(--text-dim);margin-top:6px">Click a "Booked" month to join the waitlist and get notified when it frees up.</p>
    </div>

    <!-- VENDOR CONTACT — Locked until booking, prevents direct deal bypass -->
    <div class="hd-contact-section">
      <h4>📞 Media Owner</h4>
      ${myBookingForThis ? `
      <div class="hd-contact-card">
        <div class="hd-contact-unlocked-note">✅ You have an active booking — full contact revealed</div>
        <div class="hd-contact-grid">
          <div class="hd-contact-item"><span class="hd-contact-icon">👤</span><div><div class="hd-contact-label">Name</div><div class="hd-contact-value">${vendor?.name||'—'}</div></div></div>
          <div class="hd-contact-item"><span class="hd-contact-icon">🏢</span><div><div class="hd-contact-label">Company</div><div class="hd-contact-value">${vendor?.company||'—'}</div></div></div>
          <div class="hd-contact-item"><span class="hd-contact-icon">📱</span><div><div class="hd-contact-label">Mobile</div><div class="hd-contact-value"><a href="tel:${vendor?.mobile}" style="color:var(--teal)">${vendor?.mobile||'—'}</a></div></div></div>
          <div class="hd-contact-item"><span class="hd-contact-icon">📧</span><div><div class="hd-contact-label">Email</div><div class="hd-contact-value"><a href="mailto:${vendor?.email}" style="color:var(--teal)">${vendor?.email||'—'}</a></div></div></div>
          ${vendor?.gst?`<div class="hd-contact-item"><span class="hd-contact-icon">🧾</span><div><div class="hd-contact-label">GST</div><div class="hd-contact-value gst-code">${vendor.gst}</div></div></div>`:''}
        </div>
        <button onclick="closeModal();showConversation('${myBookingForThis.id}')" class="btn-message-vendor">
          💬 Message via Spydee (Recommended)
        </button>
        <p class="hd-book-note" style="color:var(--amber)">⚠ Keep all deals on Spydee for your protection and dispute coverage.</p>
      </div>` : `
      <div class="hd-contact-locked">
        <div class="hd-contact-locked-icon">🔒</div>
        <div>
          <div style="font-weight:700;margin-bottom:4px">Contact revealed after booking</div>
          <div style="font-size:12px;color:var(--text-muted)">This protects your transaction. Use Enquiry to ask questions first.</div>
        </div>
      </div>`}
    </div>

    <!-- ENQUIRY before booking -->
    ${!myBookingForThis ? `
    <div class="hd-enquiry-section">
      <h4>❓ Ask a Question</h4>
      ${myEnquiry ? `
      <div class="enquiry-thread">
        <div class="enquiry-msg sent">"${myEnquiry.text}"<span class="enquiry-time">${timeAgo(myEnquiry.ts)}</span></div>
        ${myEnquiry.reply ? `<div class="enquiry-msg received">${myEnquiry.reply}<span class="enquiry-time">${timeAgo(myEnquiry.repliedAt)}</span></div>`
          : `<div style="font-size:12px;color:var(--text-dim);padding:8px">Awaiting reply from media owner…</div>`}
      </div>` : `
      <div class="enquiry-form">
        <textarea id="enquiry-text" rows="2" placeholder="e.g. Is this board visible from both lanes? Can I book for Diwali week?"
                  style="width:100%;background:var(--bg-surface);border:1px solid var(--border);color:var(--text);padding:10px;border-radius:6px;resize:vertical;font-family:var(--font-body);font-size:13px"></textarea>
        <button onclick="submitEnquiry('${id}')" class="btn-xs-primary" style="margin-top:8px;padding:8px 16px">Send Enquiry</button>
        <p style="font-size:11px;color:var(--text-dim);margin-top:4px">Your contact details are NOT shared until you make a booking.</p>
      </div>`}
    </div>` : ''}

    <!-- REVIEWS -->
    ${bookingRatings.length > 0 ? `
    <div class="hd-reviews">
      <h4>⭐ Reviews (${bookingRatings.length})</h4>
      <div class="hd-reviews-list">
        ${bookingRatings.map(b => {
          const c = SPYDEE_DATA.users.find(u => u.id === b.customerId);
          return `<div class="hd-review-item">
            <div class="hd-review-header">
              <div class="hd-reviewer-avatar">${c?.name?.charAt(0)||'?'}</div>
              <div><strong>${c?.name||'User'}</strong>
              <div>${starsHTML(b.rating)} <span style="font-size:11px;color:var(--text-muted)">${b.ratingDate||''}</span></div></div>
            </div>
            ${b.review?`<p class="hd-review-text">"${b.review}"</p>`:''}
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    <!-- MOCKUP -->
    ${AppState.uploadedCreative ? `<div class="hd-mockup-section"><h4>🎨 Your Creative Preview</h4>${renderBillboardMockup()}</div>`
      : `<div class="hd-mockup-cta"><span>🎨</span><span>Upload artwork in the visualizer to preview on this board</span></div>`}

    <!-- BOOKING ACTION -->
    <div class="hd-booking-action">
      <div class="hd-wallet-row">
        <span>Wallet:</span>
        <strong style="color:var(--green)">${formatCurrency(user?.wallet||0)}</strong>
        <span style="color:var(--text-dim);font-size:12px">· Deposit = ${formatCurrency(Math.round(h.basePriceMonthly*0.1))}</span>
      </div>
      ${!isBooked && !isHeld ? `
        <button onclick="closeModal();handleReserve('${h.id}')" class="hd-reserve-btn">
          🔒 Reserve Now — ${formatCurrency(Math.round(h.basePriceMonthly*0.1))} deposit
        </button>
        <p class="hd-book-note">12-hour hold · Full refund if cancelled before expiry</p>`
      : isMyHold ? `
        <button onclick="closeModal();showConfirmBookingModal('${h.id}')" class="hd-book-btn">✅ Confirm Booking</button>
        <button onclick="closeModal();handleCancelHold('${h.id}')" class="hd-cancel-hold-btn">↩ Cancel Hold (Full Refund)</button>`
      : `<div class="hd-unavail">
           <span>⛔ ${statusLabel}</span>
           ${isBooked&&!onWaitlist?`<button onclick="showWaitlistModal('${id}')" class="btn-xs-primary" style="margin-left:12px">🔔 Join Waitlist</button>`:''}
           ${onWaitlist?`<span style="color:var(--amber);font-size:12px;margin-left:10px">✓ You're on the waitlist</span>`:''}
         </div>`}
    </div>
  </div>`;
  modal.classList.add('active');
}

// ── Enquiry ───────────────────────────────────────────────────
function submitEnquiry(hId) {
  const text = document.getElementById('enquiry-text')?.value?.trim();
  if (!text) return showToast('Please type a question first.', 'error');
  if (text.length < 10) return showToast('Please write a more detailed question.', 'error');
  const result = AppState.sendEnquiry(hId, text);
  if (result.ok) { showToast('❓ Enquiry sent! You\'ll be notified when vendor replies.', 'success'); showHoardingDetail(hId); }
  else showToast(result.msg || 'Failed to send.', 'error');
}

// ── Waitlist ──────────────────────────────────────────────────
function addWaitlist(hId, month) {
  const result = AppState.addToWaitlist(hId, month);
  if (result.ok) { showToast(`🔔 Added to waitlist for ${month}!`, 'success'); showHoardingDetail(hId); }
  else showToast(result.msg, 'error');
}
function showWaitlistModal(hId) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `<div class="modal-card" style="max-width:380px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>🔔 Join Waitlist — ${h?.title}</h3>
    <p style="color:var(--text-muted);font-size:13px;margin:12px 0">Select the month you're interested in. We'll notify you immediately when it becomes available.</p>
    <div class="form-group">
      <label>Month</label>
      <select id="wl-month" class="filter-select">
        ${['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02'].map(m=>`<option>${m}</option>`).join('')}
      </select>
    </div>
    <button onclick="addWaitlist('${hId}',document.getElementById('wl-month').value);closeModal()" class="btn-form-primary">Join Waitlist</button>
  </div>`;
  modal.classList.add('active');
}

// ── In-App Messaging ──────────────────────────────────────────
function showConversation(bookingId) {
  const b = SPYDEE_DATA.bookings.find(x => x.id === bookingId);
  const h = SPYDEE_DATA.hoardings.find(x => x.id === b?.hoardingId);
  const uid = AppState.currentUser.id;
  const otherId = uid === b?.customerId ? b?.vendorId : b?.customerId;
  const other = SPYDEE_DATA.users.find(u => u.id === otherId);
  AppState.markMessagesRead(bookingId);
  const msgs = AppState.getConversation(bookingId);

  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `<div class="modal-card" style="max-width:520px;display:flex;flex-direction:column;height:560px;max-height:88vh">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="msg-header">
      <div class="msg-avatar">${other?.name?.charAt(0)||'?'}</div>
      <div>
        <strong>${other?.name||'User'}</strong>
        <div style="font-size:11px;color:var(--text-muted)">Re: ${h?.title} · Booking ${bookingId}</div>
      </div>
      <div class="msg-platform-note">🔒 Spydee Platform Messages</div>
    </div>
    <div class="msg-thread" id="msg-thread">
      ${msgs.length === 0 ? `<div class="msg-empty">No messages yet. Start the conversation!</div>` : ''}
      ${msgs.map(m => {
        const isMe = m.fromId === uid;
        return `<div class="msg-bubble ${isMe?'msg-me':'msg-other'}">
          <div class="msg-text">${m.text}</div>
          <div class="msg-time">${timeAgo(m.ts)}</div>
        </div>`;
      }).join('')}
    </div>
    <div class="msg-composer">
      <textarea id="msg-input" placeholder="Type a message… (all messages are logged on platform)" rows="2"
                style="flex:1;background:var(--bg-surface);border:1px solid var(--border);color:var(--text);padding:10px;border-radius:6px;resize:none;font-family:var(--font-body);font-size:13px"
                onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMsg('${bookingId}')}"></textarea>
      <button onclick="sendMsg('${bookingId}')" class="btn-send">Send ↑</button>
    </div>
    <p style="font-size:10px;color:var(--text-dim);text-align:center;padding:6px 0">
      ⚠ Keep all negotiations on Spydee for dispute resolution coverage. Off-platform deals void your Spydee protection.
    </p>
  </div>`;
  modal.classList.add('active');
  // Scroll to bottom
  setTimeout(() => {
    const t = document.getElementById('msg-thread');
    if (t) t.scrollTop = t.scrollHeight;
  }, 50);
}

function sendMsg(bookingId) {
  const input = document.getElementById('msg-input');
  const text = input?.value?.trim();
  if (!text) return;
  const result = AppState.sendMessage(bookingId, text);
  if (result.ok) { input.value = ''; showConversation(bookingId); }
  else showToast(result.msg || 'Failed.', 'error');
}

// ── Compare Modal ─────────────────────────────────────────────
function showCompareModal() {
  const hoardings = AppState.compareList.map(id => SPYDEE_DATA.hoardings.find(h => h.id === id)).filter(Boolean);
  if (hoardings.length < 2) return showToast('Add at least 2 hoardings to compare.', 'error');
  const fields = [
    ['💰 Price/Month', h => formatCurrency(h.basePriceMonthly)],
    ['📐 Size', h => `${h.width}×${h.height}ft`],
    ['🏷 Type', h => h.type],
    ['🚦 Traffic', h => h.traffic],
    ['👁 Daily Impressions', h => h.dailyImpression.toLocaleString('en-IN')],
    ['💡 Illumination', h => h.illumination||'—'],
    ['📍 Orientation', h => h.orientation],
    ['⭐ Rating', h => h.rating>0?`${h.rating.toFixed(1)}/5 (${h.reviewCount} reviews)`:'No ratings'],
    ['🧾 GST (18%)', h => formatCurrency(Math.round(h.basePriceMonthly*0.18))],
    ['💳 Deposit (10%)', h => formatCurrency(Math.round(h.basePriceMonthly*0.10))],
  ];
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `<div class="modal-card" style="max-width:720px;overflow-x:auto">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h2 style="margin-bottom:16px">⚖ Compare Hoardings</h2>
    <div class="compare-table">
      <div class="compare-header">
        <div class="compare-field-col"></div>
        ${hoardings.map(h => `<div class="compare-board-col">
          <div class="compare-board-name">${h.title.split(' ').slice(0,3).join(' ')}</div>
          <div class="compare-board-loc">📍 ${h.location.split(',')[0]}</div>
          <button onclick="AppState.compareList=AppState.compareList.filter(id=>id!=='${h.id}');showCompareModal()" class="btn-xs" style="margin-top:6px">✕ Remove</button>
        </div>`).join('')}
      </div>
      ${fields.map(([label, fn]) => {
        const vals = hoardings.map(fn);
        const numVals = vals.map(v => parseFloat(v.replace(/[^0-9.]/g,'')));
        const best = Math.max(...numVals.filter(v=>!isNaN(v)));
        return `<div class="compare-row">
          <div class="compare-field-col">${label}</div>
          ${hoardings.map((h,i) => {
            const val = vals[i];
            const num = numVals[i];
            const isBest = !isNaN(num) && num === best && best > 0;
            return `<div class="compare-val-col ${isBest?'compare-best':''}">${val}</div>`;
          }).join('')}
        </div>`;
      }).join('')}
      <div class="compare-row compare-action-row">
        <div class="compare-field-col"></div>
        ${hoardings.map(h => `<div class="compare-val-col">
          <button onclick="closeModal();showHoardingDetail('${h.id}')" class="btn-xs-primary" style="width:100%">View & Book</button>
        </div>`).join('')}
      </div>
    </div>
    <button onclick="AppState.compareList=[];closeModal();refreshSidebarCards()" class="btn-ghost" style="margin-top:12px">Clear All</button>
  </div>`;
  modal.classList.add('active');
}

// ── Print Job Preview (show price before ordering) ────────────
function showPrintJobPreview(bookingId) {
  const b = SPYDEE_DATA.bookings.find(x => x.id === bookingId);
  const h = SPYDEE_DATA.hoardings.find(x => x.id === b?.hoardingId);
  const price = Math.round((h?.width||0) * (h?.height||0) * 12);
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `<div class="modal-card" style="max-width:420px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>🖨 Print Job — Order Confirmation</h3>
    <div class="inv-hoarding-info" style="margin:14px 0">
      <strong>${h?.title}</strong>
      <span>Dimensions: ${h?.width}ft × ${h?.height}ft</span>
      <span>Material: ${h?.material}</span>
      <span>Print Spec: ${h?.printSpec}</span>
    </div>
    <div class="invoice-table">
      <div class="inv-row"><span>Print Area</span><span>${h?.width}ft × ${h?.height}ft = ${(h?.width||0)*(h?.height||0)} sq.ft</span></div>
      <div class="inv-row"><span>Rate (₹12/sq.ft)</span><span>${formatCurrency(price)}</span></div>
      <div class="inv-row inv-total"><span>Estimated Total</span><span>${formatCurrency(price)}</span></div>
    </div>
    <p style="font-size:11px;color:var(--text-dim);margin:8px 0">Final price confirmed by printer. SLA: 3 working days.</p>
    <div class="modal-actions">
      <button onclick="handleCreatePrintJob('${bookingId}')" class="btn-form-primary">✅ Confirm & Post Job</button>
      <button onclick="closeModal()" class="btn-ghost">Cancel</button>
    </div>
  </div>`;
  modal.classList.add('active');
}

// ── Billboard Mockup ──────────────────────────────────────────
function renderBillboardMockup() {
  const h = AppState.selectedHoarding;
  if (!h || !AppState.uploadedCreative) return '';
  const aspect = (h.width||20) / (h.height||10);
  const mw = 240, mh = Math.min(Math.round(mw/aspect), 180);
  return `<div class="billboard-mockup-wrap">
    <h5>📐 ${h.title.split(' ').slice(0,3).join(' ')} · ${h.width}×${h.height}ft</h5>
    <div class="billboard-scene">
      <div class="billboard-perspective" style="width:${mw}px;height:${mh}px">
        <img src="${AppState.uploadedCreative}" class="billboard-creative"/>
      </div>
      <div class="billboard-support"><div class="support-pole"></div><div class="support-base"></div></div>
    </div>
  </div>`;
}

// ── Invoice Modal (Fixed: shows balanceDue not full amount) ───
function showConfirmBookingModal(hoardingId) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
  const user = SPYDEE_DATA.users.find(u => u.id === AppState.currentUser.id);
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `<div class="modal-card invoice-card">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="invoice-header">
      <div class="inv-logo">🕷</div>
      <div><h2 class="invoice-title">TAX INVOICE</h2>
      <p style="color:var(--text-muted);font-size:12px">Spydee OOH Marketplace · GSTIN: 27AABCS1234X1ZY</p></div>
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
          ${['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03'].map(m=>`<option>${m}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Duration</label>
        <select id="booking-duration" class="filter-select" onchange="updateInvoicePreview('${hoardingId}')">
          <option value="1">1 Month</option><option value="2">2 Months</option>
          <option value="3">3 Months</option><option value="6">6 Months</option>
        </select>
      </div>
    </div>
    <div class="invoice-table" id="invoice-preview">${getInvoiceHTML(h.basePriceMonthly, 1)}</div>
    <div class="invoice-wallet">Wallet: <strong style="color:var(--green)">${formatCurrency(user?.wallet||0)}</strong>
      <span style="color:var(--text-dim);font-size:12px"> · Deposit of ${formatCurrency(Math.round(h.basePriceMonthly*0.1))} already paid</span>
    </div>
    <div class="modal-actions">
      <button onclick="handleConfirmBooking('${hoardingId}')" class="btn-form-primary">✅ Pay Balance & Confirm</button>
      <button onclick="closeModal()" class="btn-ghost">Cancel</button>
    </div>
  </div>`;
  modal.classList.add('active');
}

function getInvoiceHTML(baseMonthly, duration) {
  const { base, gst, deposit, totalPaid, balanceDue } = calcTax(baseMonthly * duration);
  return `
    <div class="inv-row"><span>Base (${duration}mo × ${formatCurrency(baseMonthly)})</span><span>${formatCurrency(base)}</span></div>
    <div class="inv-row"><span>CGST 9%</span><span>${formatCurrency(Math.round(gst/2))}</span></div>
    <div class="inv-row"><span>SGST 9%</span><span>${formatCurrency(Math.round(gst/2))}</span></div>
    <div class="inv-row inv-sub"><span>Gross Total</span><span>${formatCurrency(totalPaid)}</span></div>
    <div class="inv-row inv-credit"><span>Less: Deposit Paid at Reserve</span><span>–${formatCurrency(deposit)}</span></div>
    <div class="inv-row inv-total"><span>Balance Due Now</span><span>${formatCurrency(balanceDue)}</span></div>`;
}

function updateInvoicePreview(hId) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
  const dur = parseInt(document.getElementById('booking-duration')?.value||1);
  const el = document.getElementById('invoice-preview');
  if (el) el.innerHTML = getInvoiceHTML(h.basePriceMonthly, dur);
}

// ── Rating Guard ──────────────────────────────────────────────
function showRatingModal(bookingId) {
  const b = SPYDEE_DATA.bookings.find(x => x.id === bookingId);
  if (b?.ratedAt) return showToast('You already rated this booking.', 'error');
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `<div class="modal-card" style="max-width:400px;text-align:center">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>⭐ Rate Your Campaign</h3>
    <p style="color:var(--text-muted);font-size:13px;margin-bottom:12px">How was your overall experience?</p>
    <div class="star-rating">${[1,2,3,4,5].map(i=>`<span class="star" onclick="setRating(${i})">${i<=0?'☆':'☆'}</span>`).join('')}</div>
    <input type="hidden" id="rating-val" value="0"/>
    <div class="form-group" style="margin-top:16px;text-align:left">
      <label>Review (optional)</label>
      <textarea id="review-text" rows="3" placeholder="Great visibility, smooth booking experience…"
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
    s.style.fontSize = i < val ? '30px' : '26px';
  });
}
function submitRating(bookingId) {
  const rating = parseInt(document.getElementById('rating-val').value);
  if (!rating || rating < 1) return showToast('Please select at least 1 star.', 'error');
  const result = AppState.rateBooking(bookingId, rating, document.getElementById('review-text').value);
  if (result.ok === false) return showToast(result.msg || 'Already rated.', 'error');
  closeModal(); showToast('⭐ Rating submitted! Thank you.', 'success'); renderDashboard();
}

// ── Cancel Booking ────────────────────────────────────────────
function showCancelBookingModal(bookingId) {
  const b = SPYDEE_DATA.bookings.find(x => x.id === bookingId);
  if (b?.printJob) {
    const pj = SPYDEE_DATA.printJobs.find(j => j.id === b.printJob);
    if (pj?.status === 'dispatched') return showToast('Cannot cancel — print job already dispatched.', 'error');
  }
  const refund = Math.round((b?.balanceDue||b?.totalDue||0) * 0.5);
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `<div class="modal-card" style="max-width:400px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>❗ Cancel Booking</h3>
    <p style="color:var(--text-muted);margin:14px 0">You'll receive a <strong style="color:var(--amber)">50% refund</strong> of <strong>${formatCurrency(refund)}</strong> on the balance paid. The 10% deposit is non-refundable.</p>
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

// ── Gallery helpers ───────────────────────────────────────────
let _hdAnnotationVisible = true;
function hd_switchPhoto(el, src, idx) {
  const mainImg = document.getElementById('hd-main-img');
  if (mainImg) mainImg.src = src;
  document.querySelectorAll('.hd-thumb').forEach(t => t.classList.remove('hd-thumb-active'));
  el.classList.add('hd-thumb-active');
  _hdAnnotationVisible = true;
  const rb = document.getElementById('hd-red-box');
  if (rb) rb.style.opacity = '1';
}
function hd_toggleAnnotation() {
  const rb = document.getElementById('hd-red-box');
  if (!rb) return;
  _hdAnnotationVisible = !_hdAnnotationVisible;
  rb.style.opacity = _hdAnnotationVisible ? '1' : '0';
  const hint = document.getElementById('hd-photo-hint');
  if (hint) hint.textContent = _hdAnnotationVisible ? 'Click to hide annotation' : 'Click to show annotation';
}

// ── Core handlers ─────────────────────────────────────────────
function selectHoarding(id) {
  AppState.selectedHoarding = SPYDEE_DATA.hoardings.find(h => h.id === id);
  AppState.save(); refreshSidebarCards(); if (_leafletMap) refreshMapMarkers();
  setTimeout(() => document.querySelector('.hoarding-card.selected')?.scrollIntoView({behavior:'smooth',block:'nearest'}), 80);
}
function handleReserve(id) {
  const result = AppState.reserveHoarding(id);
  if (result.ok) { showToast(`🔒 Reserved! ${formatCurrency(result.deposit)} deposit deducted. 12-hour hold.`, 'success'); renderDashboard(); }
  else showToast(result.msg, 'error');
}
function handleCancelHold(id) {
  const result = AppState.cancelHold(id);
  if (result.ok) { showToast(`✅ Cancelled. ${formatCurrency(result.refund)} refunded!`, 'success'); renderDashboard(); }
  else showToast(result.msg, 'error');
}
function handleConfirmBooking(hoardingId) {
  const month = document.getElementById('booking-month')?.value || '2025-07';
  const dur = parseInt(document.getElementById('booking-duration')?.value || 1);
  const result = AppState.confirmBooking(hoardingId, month, dur);
  if (result.ok) { closeModal(); showToast(`🎉 Booking confirmed! ${formatCurrency(result.invoice.balanceDue)} charged.`, 'success'); renderDashboard(); }
  else showToast(result.msg, 'error');
}
function handleCreatePrintJob(bookingId) {
  const result = AppState.createPrintJob(bookingId);
  if (result.ok) { showToast('🖨 Print job posted!', 'success'); renderDashboard(); }
  else showToast(result.msg || 'Failed.', 'error');
}
function uploadArtworkForJob(jobId) {
  const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => { AppState.updatePrintJobArtwork(jobId, ev.target.result); showToast('🎨 Artwork uploaded!','success'); renderDashboard(); };
    r.readAsDataURL(f);
  };
  inp.click();
}
function deleteJobArtwork(jobId) {
  if (!confirm('Remove artwork?')) return;
  AppState.deletePrintJobArtwork(jobId); showToast('Artwork removed.','success'); renderDashboard();
}
function setFilter(k, v) {
  AppState.filters[k] = (k==='minPrice'||k==='maxPrice') ? Number(v) : v;
  refreshSidebarCards(); if (_leafletMap) refreshMapMarkers();
}
function clearAllFilters() {
  AppState.filters = {type:'all',minPrice:0,maxPrice:999999,vendor:'all',status:'all',traffic:'all',sort:'distance'};
  AppState.radiusKm = 3; AppState._searchQuery = ''; renderDashboard();
}
function handleCreativeDrop(e) { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) loadCreativeFile(f); }
function handleCreativeUpload(e) { const f=e.target.files[0]; if(f) loadCreativeFile(f); }
function loadCreativeFile(f) { const r=new FileReader(); r.onload=ev=>{AppState.uploadedCreative=ev.target.result;renderDashboard();}; r.readAsDataURL(f); }
function clearCreative() { AppState.uploadedCreative=null; renderDashboard(); }
function updateCountdownDisplay(hId) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id===hId);
  if (!h||!h.holdExpiry) return;
  const rem = Math.max(0, h.holdExpiry-Date.now());
  const hrs=Math.floor(rem/3600000),mins=Math.floor((rem%3600000)/60000),secs=Math.floor((rem%60000)/1000);
  const str=`${hrs}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  document.querySelectorAll(`#timer-${hId}`).forEach(el=>el.textContent=str);
  const pct=rem/(12*3600000)*100;
  document.querySelectorAll(`#progress-${hId}`).forEach(el=>{
    el.style.width=pct+'%';
    el.style.background=pct>50?'var(--green)':pct>25?'var(--amber)':'var(--red)';
  });
}
