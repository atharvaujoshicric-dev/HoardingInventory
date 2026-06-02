// ============================================================
// SPYDEE v3 — Advertiser (Customer) Dashboard
// Click-to-pin + drag-circle-edge radius on SVG map
// ============================================================

const MAP_W=640, MAP_H=440;
const MAP_LAT_MAX=18.720, MAP_LAT_MIN=18.420;
const MAP_LNG_MIN=73.690, MAP_LNG_MAX=73.980;

function latLngToXY(lat,lng){
  return { x:((lng-MAP_LNG_MIN)/(MAP_LNG_MAX-MAP_LNG_MIN))*MAP_W,
           y:((MAP_LAT_MAX-lat)/(MAP_LAT_MAX-MAP_LAT_MIN))*MAP_H };
}
function xyToLatLng(x,y){
  return { lat:MAP_LAT_MAX-(y/MAP_H)*(MAP_LAT_MAX-MAP_LAT_MIN),
           lng:MAP_LNG_MIN+(x/MAP_W)*(MAP_LNG_MAX-MAP_LNG_MIN) };
}
function radiusToPx(){
  return (AppState.radiusKm/111)/(MAP_LAT_MAX-MAP_LAT_MIN)*MAP_H;
}
function pxToKm(px){
  return px*(MAP_LAT_MAX-MAP_LAT_MIN)/MAP_H*111;
}

let _mapDrag = { mode:null, startX:0, startY:0, startRpx:0 };

function renderAdvertiserView() {
  const hoardings=AppState.getFilteredHoardings();
  const user=AppState.currentUser;
  const myHolds=SPYDEE_DATA.hoardings.filter(h=>h.holdBy===user.id&&h.status==='on-hold');
  const myBookings=SPYDEE_DATA.bookings.filter(b=>b.customerId===user.id);

  return `<div class="advertiser-view">
    <div class="split-pane">

      <!-- LEFT: Map + Visualizer -->
      <div class="map-pane">
        <div class="map-toolbar">
          <div class="map-toolbar-left">
            <span class="map-label">🗺 Pune & PCMC</span>
            <span class="map-count">${hoardings.length}/${SPYDEE_DATA.hoardings.length} boards</span>
            <span class="map-hint">Click map · Drag ↔ handle · Drag pin</span>
          </div>
          <div class="map-toolbar-right">
            <div class="search-bar-mini">
              <input type="text" placeholder="Search hoardings..." value="${AppState._searchQuery}"
                     oninput="mapSearch(this.value)" class="map-search-input" />
            </div>
            <div class="night-toggle">
              <span>☀️</span>
              <label class="toggle-switch"><input type="checkbox" ${AppState.nightMode?'checked':''} onchange="toggleNightMode()"/><span class="toggle-slider"></span></label>
              <span>🌙</span>
            </div>
          </div>
        </div>

        <div class="map-canvas-wrap" id="map-canvas-wrap">
          ${renderSVGMap(hoardings)}
        </div>

        <div class="map-radius-info">
          📍 ${AppState.mapPin.lat.toFixed(4)}, ${AppState.mapPin.lng.toFixed(4)} &nbsp;|&nbsp;
          ⭕ Radius: <strong>${AppState.radiusKm}km</strong> &nbsp;|&nbsp;
          ${hoardings.length} boards in range
        </div>

        <!-- Creative Visualizer -->
        <div class="creative-visualizer">
          <div class="viz-header"><h4>🎨 Creative Mockup Visualizer</h4><p>Upload artwork → preview on any selected hoarding</p></div>
          <div class="viz-drop-zone" id="viz-drop" ondragover="event.preventDefault()" ondrop="handleCreativeDrop(event)" onclick="document.getElementById('creative-upload').click()">
            ${AppState.uploadedCreative
              ? `<div class="creative-preview-row">
                   <img src="${AppState.uploadedCreative}" style="height:52px;border-radius:4px;border:1px solid var(--border)"/>
                   <div>
                     <div style="font-size:12px;color:var(--green);font-weight:600">✓ Creative loaded</div>
                     <button onclick="event.stopPropagation();clearCreative()" class="btn-del-creative">🗑 Remove</button>
                   </div>
                 </div>`
              : `<div class="drop-icon">⬆️</div><p>Drop artwork or click to upload</p><span class="drop-hint">PNG, JPG, WebP</span>`}
          </div>
          <input type="file" id="creative-upload" accept="image/*" style="display:none" onchange="handleCreativeUpload(event)"/>
          ${AppState.selectedHoarding && AppState.uploadedCreative ? renderBillboardMockup() : ''}
        </div>
      </div>

      <!-- RIGHT: Filters + Cards -->
      <div class="sidebar-pane">

        ${myHolds.length>0 ? `<div class="holds-panel">
          <h4>⏱ Active Holds (${myHolds.length})</h4>
          ${myHolds.map(h=>renderHoldBanner(h)).join('')}
        </div>` : ''}

        <div class="filter-panel">
          <div class="filter-header-row">
            <h3 class="filter-title">🔍 Filters</h3>
            <button onclick="clearAllFilters()" class="btn-xs">Clear All</button>
          </div>
          <div class="filter-section">
            <label>Radius: <strong id="radius-val">${AppState.radiusKm}km</strong></label>
            <input type="range" min="0.5" max="10" step="0.5" value="${AppState.radiusKm}" oninput="syncRadiusSlider(this.value)" class="range-input"/>
            <div class="range-labels"><span>500m</span><span>10km</span></div>
          </div>
          <div class="filter-section">
            <label>Type</label>
            <div class="filter-chips">
              ${['all','Backlit','Digital LED','Flex'].map(t=>`<button class="chip ${AppState.filters.type===t?'active':''}" onclick="setFilter('type','${t}')">${t==='all'?'All':t}</button>`).join('')}
            </div>
          </div>
          <div class="filter-section">
            <label>Status</label>
            <div class="filter-chips">
              ${['all','available','on-hold','booked'].map(s=>`<button class="chip ${AppState.filters.status===s?'active':''}" onclick="setFilter('status','${s}')">${s==='all'?'All':s}</button>`).join('')}
            </div>
          </div>
          <div class="filter-section">
            <label>Budget (Monthly)</label>
            <div class="price-inputs">
              <input type="number" placeholder="Min ₹" value="${AppState.filters.minPrice||''}" oninput="setFilter('minPrice',this.value||0)" class="price-input"/>
              <span>–</span>
              <input type="number" placeholder="Max ₹" value="${AppState.filters.maxPrice<999999?AppState.filters.maxPrice:''}" oninput="setFilter('maxPrice',this.value||999999)" class="price-input"/>
            </div>
          </div>
          <div class="filter-section">
            <label>Traffic</label>
            <div class="filter-chips">
              ${['all','Low','Medium','High','Very High'].map(t=>`<button class="chip ${AppState.filters.traffic===t?'active':''}" onclick="setFilter('traffic','${t}')">${t==='all'?'All':t}</button>`).join('')}
            </div>
          </div>
          <div class="filter-section">
            <label>Media Owner</label>
            <select onchange="setFilter('vendor',this.value)" class="filter-select">
              <option value="all">All Vendors</option>
              ${SPYDEE_DATA.users.filter(u=>u.role==='vendor').map(v=>`<option value="${v.id}" ${AppState.filters.vendor===v.id?'selected':''}>${v.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="hoarding-cards" id="hoarding-cards">
          ${hoardings.length===0
            ? `<div class="empty-state">No hoardings in range.<br>Try clicking on the map to repin, or expand the radius.</div>`
            : hoardings.map(h=>renderHoardingCard(h)).join('')}
        </div>

        ${myBookings.length>0 ? `<div class="my-bookings">
          <h4>📋 My Campaigns</h4>
          ${myBookings.map(b=>renderMyBookingCard(b)).join('')}
        </div>` : ''}
      </div>

    </div>
  </div>`;
}

// ── Interactive SVG Map ───────────────────────────────────────
function renderSVGMap(filteredHoardings) {
  const pin=latLngToXY(AppState.mapPin.lat,AppState.mapPin.lng);
  const rPx=radiusToPx();
  const n=AppState.nightMode;
  const bg=n?'#080812':'#e4e4f4';
  const roadColor=n?'#1e1e38':'#c4c4dc';
  const gridColor=n?'#ffffff05':'#00000005';

  const roads=`
    <path d="M0,95 Q100,115 200,165 Q350,225 640,295" stroke="${roadColor}" stroke-width="6" fill="none" opacity="0.7"/>
    <path d="M0,165 Q160,185 320,205 T640,205" stroke="${roadColor}" stroke-width="4" fill="none" opacity="0.5"/>
    <ellipse cx="295" cy="275" rx="185" ry="115" stroke="${roadColor}" stroke-width="4" fill="none" opacity="0.4"/>
    <line x1="305" y1="0" x2="325" y2="${MAP_H}" stroke="${roadColor}" stroke-width="4" opacity="0.4"/>
    <line x1="0" y1="205" x2="${MAP_W}" y2="215" stroke="${roadColor}" stroke-width="3" opacity="0.35"/>
    <path d="M505,0 Q525,105 545,205 Q565,305 585,${MAP_H}" stroke="${roadColor}" stroke-width="3" fill="none" opacity="0.3"/>
    <path d="M0,280 Q200,265 400,250 Q520,242 640,235" stroke="${roadColor}" stroke-width="3" fill="none" opacity="0.3"/>
  `;

  const areas=[
    {name:'Hinjawadi',lat:18.591,lng:73.738},{name:'Wakad',lat:18.598,lng:73.761},
    {name:'Baner',lat:18.559,lng:73.792},{name:'Aundh',lat:18.560,lng:73.810},
    {name:'SB Rd',lat:18.527,lng:73.837},{name:'Kothrud',lat:18.508,lng:73.820},
    {name:'Viman Ngr',lat:18.564,lng:73.912},{name:'Hadapsar',lat:18.508,lng:73.930},
    {name:'Katraj',lat:18.453,lng:73.860},{name:'Moshi',lat:18.672,lng:73.848},
    {name:'Pimpri',lat:18.619,lng:73.802},{name:'Chinchwad',lat:18.645,lng:73.797},
    {name:'Nigdi',lat:18.651,lng:73.773},{name:'PCMC',lat:18.633,lng:73.812},
  ].map(a=>{
    const p=latLngToXY(a.lat,a.lng);
    return `<text x="${p.x}" y="${p.y}" fill="${n?'#ffffff22':'#00000022'}" font-size="9" font-family="JetBrains Mono,monospace" text-anchor="middle" pointer-events="none">${a.name}</text>`;
  }).join('');

  const markers=SPYDEE_DATA.hoardings.map(h=>{
    const p=latLngToXY(h.lat,h.lng);
    const inFilter=!!filteredHoardings.find(fh=>fh.id===h.id);
    const isSel=AppState.selectedHoarding?.id===h.id;
    const isHeld=h.status==='on-hold', isBooked=h.status==='booked';
    const color=isBooked?'#e74c3c':isHeld?'#f5a623':h.type==='Digital LED'?'#00d4b4':h.type==='Backlit'?'#f5a623':'#a29bfe';
    const op=inFilter?1:0.18;
    const sz=isSel?11:7;
    return `<g class="map-marker-svg" opacity="${op}" onclick="selectHoarding('${h.id}')" style="cursor:pointer" transform="translate(${p.x},${p.y})">
      ${isSel?`<circle r="22" fill="${color}" opacity="0.12"/>
               <circle r="15" fill="${color}" opacity="0.2"/>
               <circle r="11" fill="${color}" opacity="0.3"/>`:``}
      <circle r="${sz}" fill="${color}" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/>
      ${h.type==='Digital LED'?`<circle r="3.5" fill="white" opacity="0.8"/>`:``}
      ${isHeld?`<text y="2" font-size="7" text-anchor="middle" fill="white" font-weight="bold">H</text>`:``}
      ${isBooked?`<text y="2" font-size="7" text-anchor="middle" fill="white" font-weight="bold">B</text>`:``}
      ${h.featured?`<polygon points="0,-${sz+4} 2,-${sz} -2,-${sz}" fill="#f5a623" opacity="0.9"/>`:``}
      <title>${h.title}\n${formatCurrency(h.basePriceMonthly)}/mo · ${h.status}\nClick to select</title>
    </g>`;
  }).join('');

  const handleX=pin.x+rPx, handleY=pin.y;

  return `<svg id="spydee-map" width="${MAP_W}" height="${MAP_H}"
       viewBox="0 0 ${MAP_W} ${MAP_H}"
       style="background:${bg};display:block;width:100%;cursor:crosshair;user-select:none;max-height:440px"
       onmousedown="mapMouseDown(event)" onmousemove="mapMouseMove(event)" onmouseup="mapMouseUp(event)"
       ontouchstart="mapTouchStart(event)" ontouchmove="mapTouchMove(event)" ontouchend="mapTouchEnd(event)">
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0 L0 0 0 40" fill="none" stroke="${n?'#ffffff05':'#00000005'}" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)"/>
    ${roads}
    ${areas}

    <!-- Radius circle -->
    <circle id="r-circle" cx="${pin.x}" cy="${pin.y}" r="${rPx}"
            fill="${n?'rgba(245,166,35,0.05)':'rgba(245,166,35,0.07)'}"
            stroke="#f5a623" stroke-width="2" stroke-dasharray="8,5" pointer-events="none"/>

    <!-- Radius resize handle -->
    <g id="r-handle" style="cursor:ew-resize" transform="translate(${handleX},${handleY})"
       onmousedown="rHandleMouseDown(event)" ontouchstart="rHandleTouchStart(event)">
      <circle r="10" fill="${n?'#f5a623':'#f5a623'}" stroke="white" stroke-width="2" opacity="0.95"/>
      <text y="1" font-size="10" text-anchor="middle" fill="black" font-weight="bold" pointer-events="none">↔</text>
    </g>

    ${markers}

    <!-- Draggable Pin -->
    <g id="map-pin" style="cursor:grab" transform="translate(${pin.x},${pin.y})"
       onmousedown="pinMouseDown(event)" ontouchstart="pinTouchStart(event)">
      <circle r="7" fill="#e74c3c" stroke="white" stroke-width="2.5"/>
      <line x1="0" y1="-7" x2="0" y2="-24" stroke="#e74c3c" stroke-width="2.5"/>
      <circle cx="0" cy="-30" r="8" fill="#e74c3c" stroke="white" stroke-width="2"/>
      <circle cx="0" cy="-30" r="3.5" fill="white"/>
      <title>Drag pin or click map to reposition</title>
    </g>

    <!-- Radius km label -->
    <text x="${Math.min(pin.x+rPx+12, MAP_W-40)}" y="${pin.y+4}"
          fill="${n?'#f5a623cc':'#c07000bb'}" font-size="11"
          font-family="JetBrains Mono,monospace" pointer-events="none"
          id="r-label">${AppState.radiusKm}km</text>

    <!-- Coord watermark -->
    <text id="coord-hint" x="8" y="${MAP_H-8}" fill="${n?'#ffffff28':'#00000020'}"
          font-size="9.5" font-family="JetBrains Mono,monospace" pointer-events="none">
      ${AppState.mapPin.lat.toFixed(4)},${AppState.mapPin.lng.toFixed(4)}
    </text>
  </svg>`;
}

// ── Map Mouse/Touch Interactions ──────────────────────────────
function getSVGCoords(event, svg) {
  const rect=svg.getBoundingClientRect();
  const scaleX=MAP_W/rect.width, scaleY=MAP_H/rect.height;
  const clientX=event.touches?.[0]?.clientX??event.clientX;
  const clientY=event.touches?.[0]?.clientY??event.clientY;
  return { x:(clientX-rect.left)*scaleX, y:(clientY-rect.top)*scaleY };
}

function mapMouseDown(e) {
  const tgt=e.target;
  // ignore if clicking on pin, radius handle, or marker
  if(tgt.closest('#map-pin')||tgt.closest('#r-handle')||tgt.closest('.map-marker-svg')) return;
  _mapDrag.mode=null;
}

function mapMouseMove(e) {
  const svg=document.getElementById('spydee-map');
  if(!svg) return;
  if(_mapDrag.mode==='radius') {
    const {x}=getSVGCoords(e,svg);
    const pin=latLngToXY(AppState.mapPin.lat,AppState.mapPin.lng);
    const newRpx=Math.max(15, x-pin.x);
    AppState.radiusKm=Math.round(Math.min(10,Math.max(0.5,pxToKm(newRpx)))*2)/2;
    updateMapLive();
  } else if(_mapDrag.mode==='pin') {
    const {x,y}=getSVGCoords(e,svg);
    const {lat,lng}=xyToLatLng(Math.max(0,Math.min(MAP_W,x)),Math.max(0,Math.min(MAP_H,y)));
    AppState.mapPin={lat:parseFloat(lat.toFixed(5)),lng:parseFloat(lng.toFixed(5))};
    updateMapLive();
  }
}

function mapMouseUp(e) {
  if(_mapDrag.mode==='radius'||_mapDrag.mode==='pin') {
    _mapDrag.mode=null;
    renderDashboard();
    return;
  }
  // Click to place pin (only if not on pin/handle/marker)
  const svg=document.getElementById('spydee-map');
  if(!svg) return;
  const tgt=e.target;
  if(tgt.closest('#map-pin')||tgt.closest('#r-handle')||tgt.closest('.map-marker-svg')||tgt.closest('g')) return;
  const {x,y}=getSVGCoords(e,svg);
  const {lat,lng}=xyToLatLng(x,y);
  AppState.mapPin={lat:parseFloat(lat.toFixed(5)),lng:parseFloat(lng.toFixed(5))};
  _mapDrag.mode=null;
  renderDashboard();
}

function rHandleMouseDown(e) { e.stopPropagation(); _mapDrag.mode='radius'; }
function pinMouseDown(e) { e.stopPropagation(); _mapDrag.mode='pin'; document.getElementById('map-pin').style.cursor='grabbing'; }

function mapTouchStart(e) { e.preventDefault(); }
function rHandleTouchStart(e) { e.stopPropagation(); e.preventDefault(); _mapDrag.mode='radius'; }
function pinTouchStart(e) { e.stopPropagation(); e.preventDefault(); _mapDrag.mode='pin'; }
function mapTouchMove(e) { e.preventDefault(); mapMouseMove(e); }
function mapTouchEnd(e) { mapMouseUp(e); }

function updateMapLive() {
  const pin=latLngToXY(AppState.mapPin.lat,AppState.mapPin.lng);
  const rPx=radiusToPx();
  const c=document.getElementById('r-circle');
  const h=document.getElementById('r-handle');
  const lbl=document.getElementById('r-label');
  const coord=document.getElementById('coord-hint');
  const pinEl=document.getElementById('map-pin');
  const rvEl=document.getElementById('radius-val');
  if(c){ c.setAttribute('cx',pin.x);c.setAttribute('cy',pin.y);c.setAttribute('r',rPx); }
  if(h) h.setAttribute('transform',`translate(${pin.x+rPx},${pin.y})`);
  if(lbl){ lbl.setAttribute('x',Math.min(pin.x+rPx+12,MAP_W-40));lbl.setAttribute('y',pin.y+4);lbl.textContent=AppState.radiusKm+'km'; }
  if(coord) coord.textContent=`${AppState.mapPin.lat.toFixed(4)},${AppState.mapPin.lng.toFixed(4)}`;
  if(pinEl) pinEl.setAttribute('transform',`translate(${pin.x},${pin.y})`);
  if(rvEl) rvEl.textContent=AppState.radiusKm+'km';
}

function syncRadiusSlider(val) {
  AppState.radiusKm=Number(val);
  updateMapLive();
  clearTimeout(AppState._radiusTimer);
  AppState._radiusTimer=setTimeout(()=>renderDashboard(),300);
}

function mapSearch(val) {
  AppState._searchQuery=val;
  clearTimeout(AppState._searchTimer);
  AppState._searchTimer=setTimeout(()=>renderDashboard(),200);
}

// ── Hold Banner ───────────────────────────────────────────────
function renderHoldBanner(h) {
  const remaining=Math.max(0,h.holdExpiry-Date.now());
  const hrs=Math.floor(remaining/3600000);
  const mins=Math.floor((remaining%3600000)/60000);
  const secs=Math.floor((remaining%60000)/1000);
  const pct=remaining/(12*3600000)*100;
  return `<div class="hold-card">
    <div class="hold-info">
      <strong>${h.title.split(' ').slice(0,3).join(' ')}</strong>
      <span class="hold-timer" id="timer-${h.id}">${hrs}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}</span>
    </div>
    <div class="hcb-progress-wrap"><div class="hcb-progress" id="progress-${h.id}" style="width:${pct}%;background:${pct>50?'var(--green)':pct>25?'var(--amber)':'var(--red)'}"></div></div>
    <div class="hold-actions">
      <button onclick="handleCancelHold('${h.id}')" class="btn-cancel-hold">↩ Cancel (Full Refund)</button>
      <button onclick="showConfirmBookingModal('${h.id}')" class="btn-confirm-hold">✅ Book Now</button>
    </div>
  </div>`;
}

// ── Hoarding Card ─────────────────────────────────────────────
function renderHoardingCard(h) {
  const isHeld=h.status==='on-hold', isBooked=h.status==='booked';
  const isMyHold=h.holdBy===AppState.currentUser?.id;
  const isSel=AppState.selectedHoarding?.id===h.id;
  const dist=haversineDistance(AppState.mapPin.lat,AppState.mapPin.lng,h.lat,h.lng);
  const vendor=SPYDEE_DATA.users.find(u=>u.id===h.vendorId);

  return `<div class="hoarding-card ${isSel?'selected':''}" onclick="selectHoarding('${h.id}')">
    <div class="card-image-wrap">
      <div class="card-image">
        <div class="billboard-thumb">
          <div class="bb-face ${h.type==='Digital LED'?'bb-digital':h.type==='Backlit'?'bb-backlit':'bb-flex'}"
               style="width:${Math.min(h.width*1.8,80)}px;height:${Math.min(h.height*1.8,40)}px">
            ${AppState.uploadedCreative&&isSel?`<img src="${AppState.uploadedCreative}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;"/>`:``}
          </div>
          <div class="bb-pole"></div>
        </div>
      </div>
      <span class="dist-badge">${dist<1000?(dist/1000).toFixed(2)+'km':(dist).toFixed(0)+'m'}</span>
      ${isBooked?`<span class="badge-booked">BOOKED</span>`:isHeld?`<span class="badge-hold">ON HOLD</span>`:`<span class="badge-avail">AVAIL</span>`}
      ${h.verified?`<span class="badge-verified">✓</span>`:`<span class="badge-unverified">⏳</span>`}
      ${h.featured?`<span class="badge-featured">⭐</span>`:''}
    </div>
    <div class="card-body">
      <h4 class="card-title">${h.title}</h4>
      <p class="card-location">📍 ${h.location.split(',').slice(0,2).join(',')}</p>
      <div class="card-specs">
        <span class="spec-tag">${h.width}×${h.height}ft</span>
        <span class="spec-tag">${h.type}</span>
        <span class="spec-tag">${h.orientation}</span>
        <span class="spec-tag">👁 ${(h.dailyImpression/1000).toFixed(0)}K/day</span>
        <span class="spec-tag traffic-${h.traffic?.toLowerCase().replace(' ','-')}">${h.traffic}</span>
      </div>
      ${h.rating>0?`<div class="card-rating">${starsHTML(Math.round(h.rating))} <span style="font-size:11px;color:var(--text-muted)">${h.rating.toFixed(1)} (${h.reviewCount})</span></div>`:''}
      <div class="card-footer">
        <div class="card-price"><span class="price-main">${formatCurrency(h.basePriceMonthly)}</span><span class="price-unit">/mo</span></div>
        <div class="card-actions">
          ${!isBooked&&!isHeld?`<button onclick="event.stopPropagation();handleReserve('${h.id}')" class="btn-reserve">🔒 Reserve</button>`
            :isMyHold?`<button onclick="event.stopPropagation();showConfirmBookingModal('${h.id}')" class="btn-book-now">✅ Book</button>`
            :`<span class="unavail-label">${isBooked?'Booked':'Held'}</span>`}
        </div>
      </div>
      ${isMyHold?`<div class="hold-countdown-bar">
        <div class="hcb-timer" id="timer-${h.id}">--:--:--</div>
        <div class="hcb-progress" id="progress-${h.id}" style="width:100%"></div>
      </div>`:''}
    </div>
  </div>`;
}

// ── My Booking Card ───────────────────────────────────────────
function renderMyBookingCard(b) {
  const h=SPYDEE_DATA.hoardings.find(x=>x.id===b.hoardingId);
  const pj=b.printJob?SPYDEE_DATA.printJobs.find(j=>j.id===b.printJob):null;
  return `<div class="booking-mini-card">
    <div class="bmc-info">
      <strong>${h?.title||b.hoardingId}</strong>
      <span class="status-badge status-${b.status==='confirmed'?'confirmed':b.status==='cancelled'?'cancelled':'hold'}">${b.status}</span>
    </div>
    <div class="bmc-details">${b.month}×${b.durationMonths||1}mo · ${formatCurrency(b.totalDue)}</div>
    ${b.status==='confirmed'?`<div class="bmc-actions">
      ${!b.printJob?`<button onclick="handleCreatePrintJob('${b.id}')" class="btn-xs-primary">🖨 Order Print</button>`:`
        <span class="print-badge">🖨 ${pj?.status||'ordered'}</span>
        ${pj&&!pj.artworkUrl&&pj.status!=='dispatched'?`<button onclick="uploadArtworkForJob('${b.printJob}')" class="btn-xs-primary">📤 Upload Art</button>`:''}
        ${pj?.artworkUrl?`<button onclick="deleteJobArtwork('${b.printJob}')" class="btn-xs" style="color:var(--red)">🗑 Art</button>`:''}
      `}
      ${!b.rating?`<button onclick="showRatingModal('${b.id}')" class="btn-xs">⭐ Rate</button>`:`<span style="color:var(--amber);font-size:12px">${'★'.repeat(b.rating)}</span>`}
      <button onclick="showCancelBookingModal('${b.id}')" class="btn-xs" style="color:var(--red)">Cancel</button>
    </div>`:''}
  </div>`;
}

// ── Billboard Mockup ──────────────────────────────────────────
function renderBillboardMockup() {
  const h=AppState.selectedHoarding;
  if(!h) return '';
  const aspect=h.width/h.height;
  const mw=260, mh=Math.round(mw/aspect);
  return `<div class="billboard-mockup-wrap">
    <h5>📐 ${h.title.split(' ').slice(0,3).join(' ')} · ${h.width}×${h.height}ft</h5>
    <div class="billboard-scene">
      <div class="billboard-perspective" style="width:${mw}px;height:${mh}px">
        <img src="${AppState.uploadedCreative}" class="billboard-creative ${AppState.nightMode?'night-glow':''}"/>
        ${AppState.nightMode?`<div class="night-overlay"></div><div class="night-emission"></div>`:''}
      </div>
      <div class="billboard-support"><div class="support-pole"></div><div class="support-base"></div></div>
    </div>
    <p class="mockup-hint">${AppState.nightMode?'🌙 Night backlit simulation':'☀️ Day view'}</p>
  </div>`;
}

// ── Invoice Modal ─────────────────────────────────────────────
function showConfirmBookingModal(hoardingId) {
  const h=SPYDEE_DATA.hoardings.find(x=>x.id===hoardingId);
  const modal=document.getElementById('modal-overlay');
  modal.innerHTML=`<div class="modal-card invoice-card">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="invoice-header">
      <div class="inv-logo">🕷</div>
      <div><h2 class="invoice-title">TAX INVOICE</h2><p style="color:var(--text-muted);font-size:13px">Spydee OOH Marketplace · GSTIN: 27AABCS1234X1ZY</p></div>
    </div>
    <h3 style="font-size:14px;color:var(--text-muted);margin-bottom:16px">📍 ${h.title}</h3>
    <div class="form-row" style="margin-bottom:16px">
      <div class="form-group">
        <label>Campaign Month</label>
        <select id="booking-month" class="filter-select">
          ${['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12'].map(m=>`<option>${m}</option>`).join('')}
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
    <div class="invoice-table" id="invoice-preview">${getInvoiceHTML(h.basePriceMonthly,1)}</div>
    <div class="invoice-wallet">Wallet Balance: <strong style="color:var(--green)">${formatCurrency(AppState.currentUser?.wallet||0)}</strong></div>
    <div class="modal-actions">
      <button onclick="handleConfirmBooking('${hoardingId}')" class="btn-form-primary">✅ Confirm & Pay</button>
      <button onclick="closeModal()" class="btn-ghost">Cancel</button>
    </div>
  </div>`;
  modal.classList.add('active');
}

function getInvoiceHTML(baseMonthly,duration) {
  const {base,gst,deposit,totalDue}=calcTax(baseMonthly*duration);
  return `
  <div class="inv-row"><span>Base Price (${duration}×${formatCurrency(baseMonthly)})</span><span>${formatCurrency(base)}</span></div>
  <div class="inv-row"><span>CGST @ 9%</span><span>${formatCurrency(Math.round(gst/2))}</span></div>
  <div class="inv-row"><span>SGST @ 9%</span><span>${formatCurrency(Math.round(gst/2))}</span></div>
  <div class="inv-row inv-sub"><span>Gross Total</span><span>${formatCurrency(base+gst)}</span></div>
  <div class="inv-row inv-credit"><span>Less: 10% Deposit Paid</span><span>–${formatCurrency(deposit)}</span></div>
  <div class="inv-row inv-total"><span>Balance Due</span><span>${formatCurrency(totalDue)}</span></div>`;
}

function updateInvoicePreview(hId) {
  const h=SPYDEE_DATA.hoardings.find(x=>x.id===hId);
  const dur=parseInt(document.getElementById('booking-duration')?.value||1);
  const el=document.getElementById('invoice-preview');
  if(el) el.innerHTML=getInvoiceHTML(h.basePriceMonthly,dur);
}

// ── Rating, Cancel, Artwork ───────────────────────────────────
function showRatingModal(bookingId) {
  const modal=document.getElementById('modal-overlay');
  modal.innerHTML=`<div class="modal-card" style="max-width:400px;text-align:center">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>⭐ Rate Your Campaign</h3>
    <div class="star-rating" id="star-rating">
      ${[1,2,3,4,5].map(i=>`<span class="star" onclick="setRating(${i})" data-v="${i}">☆</span>`).join('')}
    </div>
    <input type="hidden" id="rating-val" value="0"/>
    <div class="form-group" style="margin-top:16px;text-align:left">
      <label>Review (optional)</label>
      <textarea id="review-text" rows="3" placeholder="Great visibility, smooth experience..." style="width:100%;background:var(--bg-surface);border:1px solid var(--border);color:var(--text);padding:10px;border-radius:6px;resize:vertical;font-family:var(--font-body)"></textarea>
    </div>
    <button onclick="submitRating('${bookingId}')" class="btn-form-primary">Submit Rating</button>
  </div>`;
  modal.classList.add('active');
}

function setRating(val) {
  document.getElementById('rating-val').value=val;
  document.querySelectorAll('.star').forEach((s,i)=>{
    s.textContent=i<val?'★':'☆';
    s.style.color=i<val?'var(--amber)':'var(--text-muted)';
  });
}

function submitRating(bookingId) {
  const rating=parseInt(document.getElementById('rating-val').value);
  if(!rating) return showToast('Please select a rating.','error');
  AppState.rateBooking(bookingId,rating,document.getElementById('review-text').value);
  closeModal(); showToast('⭐ Rating submitted!','success'); renderDashboard();
}

function showCancelBookingModal(bookingId) {
  const b=SPYDEE_DATA.bookings.find(x=>x.id===bookingId);
  const refund=Math.round(b.totalDue*0.5);
  const modal=document.getElementById('modal-overlay');
  modal.innerHTML=`<div class="modal-card" style="max-width:400px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>❗ Cancel Booking</h3>
    <p style="color:var(--text-muted);margin:12px 0">You will receive a <strong style="color:var(--amber)">50% refund</strong> of ${formatCurrency(refund)}.</p>
    <div class="modal-actions">
      <button onclick="handleCancelBookingConfirm('${bookingId}')" class="btn-form-primary" style="background:var(--red)">Confirm Cancel</button>
      <button onclick="closeModal()" class="btn-ghost">Keep Booking</button>
    </div>
  </div>`;
  modal.classList.add('active');
}

function handleCancelBookingConfirm(bookingId) {
  const result=AppState.cancelBooking(bookingId);
  if(result.ok){ closeModal(); showToast(`Cancelled. ${formatCurrency(result.refund)} refunded.`,'success'); renderDashboard(); }
  else showToast(result.msg,'error');
}

function uploadArtworkForJob(jobId) {
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=e=>{
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=ev=>{ AppState.updatePrintJobArtwork(jobId,ev.target.result); showToast('🎨 Artwork uploaded!','success'); renderDashboard(); };
    r.readAsDataURL(f);
  };
  inp.click();
}

function deleteJobArtwork(jobId) {
  if(!confirm('Remove artwork from this job?')) return;
  AppState.deletePrintJobArtwork(jobId); showToast('Artwork removed.','success'); renderDashboard();
}

// ── Handlers ──────────────────────────────────────────────────
function selectHoarding(id) {
  AppState.selectedHoarding=SPYDEE_DATA.hoardings.find(h=>h.id===id);
  AppState.save(); renderDashboard();
  setTimeout(()=>document.querySelector('.hoarding-card.selected')?.scrollIntoView({behavior:'smooth',block:'nearest'}),80);
}

function handleReserve(id) {
  const result=AppState.reserveHoarding(id);
  if(result.ok){ showToast(`🔒 Reserved! ${formatCurrency(result.deposit)} deposit. 12h hold.`,'success'); renderDashboard(); }
  else showToast(result.msg,'error');
}

function handleCancelHold(id) {
  const result=AppState.cancelHold(id);
  if(result.ok){ showToast('✅ Cancelled. Full deposit refunded!','success'); renderDashboard(); }
  else showToast(result.msg,'error');
}

function handleConfirmBooking(hoardingId) {
  const month=document.getElementById('booking-month')?.value||'2025-07';
  const dur=parseInt(document.getElementById('booking-duration')?.value||1);
  const result=AppState.confirmBooking(hoardingId,month,dur);
  if(result.ok){ closeModal(); showToast(`🎉 Booked! ${formatCurrency(result.invoice.totalDue)} charged.`,'success'); renderDashboard(); }
  else showToast(result.msg,'error');
}

function handleCreatePrintJob(bookingId) {
  const result=AppState.createPrintJob(bookingId);
  if(result.ok){ showToast('🖨 Print job created!','success'); renderDashboard(); }
  else showToast(result.msg||'Failed.','error');
}

function toggleNightMode() { AppState.nightMode=!AppState.nightMode; renderDashboard(); }
function setFilter(k,v) { AppState.filters[k]=(k==='minPrice'||k==='maxPrice')?Number(v):v; renderDashboard(); }
function clearAllFilters() { AppState.filters={type:'all',minPrice:0,maxPrice:999999,vendor:'all',status:'all',traffic:'all'}; AppState.radiusKm=3; AppState._searchQuery=''; renderDashboard(); }
function handleCreativeDrop(e) { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) loadCreativeFile(f); }
function handleCreativeUpload(e) { const f=e.target.files[0]; if(f) loadCreativeFile(f); }
function loadCreativeFile(f) { const r=new FileReader(); r.onload=ev=>{ AppState.uploadedCreative=ev.target.result; renderDashboard(); }; r.readAsDataURL(f); }
function clearCreative() { AppState.uploadedCreative=null; renderDashboard(); }

function updateCountdownDisplay(hId) {
  const h=SPYDEE_DATA.hoardings.find(x=>x.id===hId);
  if(!h||!h.holdExpiry) return;
  const rem=Math.max(0,h.holdExpiry-Date.now());
  const hrs=Math.floor(rem/3600000),mins=Math.floor((rem%3600000)/60000),secs=Math.floor((rem%60000)/1000);
  const str=`${hrs}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  document.querySelectorAll(`#timer-${hId}`).forEach(el=>el.textContent=str);
  const pct=rem/(12*3600000)*100;
  document.querySelectorAll(`#progress-${hId}`).forEach(el=>{
    el.style.width=pct+'%';
    el.style.background=pct>50?'var(--green)':pct>25?'var(--amber)':'var(--red)';
  });
}
