// ============================================================
// SPYDEE v3 — Real Map Engine (Leaflet + OpenStreetMap)
// ============================================================

let _leafletMap = null;
let _pinMarker = null;
let _radiusCircle = null;
let _hoardingMarkers = {};
let _mapInitialized = false;
let _mapContainer = null;

// Leaflet custom icons
function createHoardingIcon(h, isSelected) {
  const color = h.status === 'booked' ? '#e74c3c'
    : h.status === 'on-hold' ? '#f5a623'
    : h.type === 'Digital LED' ? '#00d4b4'
    : h.type === 'Backlit' ? '#f5a623'
    : '#a29bfe';
  const size = isSelected ? 18 : 12;
  const label = h.status === 'booked' ? 'B' : h.status === 'on-hold' ? 'H' : '';
  const star = h.featured ? '⭐' : '';
  const html = `
    <div style="
      width:${size + 8}px; height:${size + 8}px;
      background:${color}; border:2px solid white;
      border-radius:50%; display:flex; align-items:center; justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
      ${isSelected ? `box-shadow:0 0 0 4px ${color}40, 0 4px 12px rgba(0,0,0,0.6);` : ''}
      font-size:9px; font-weight:800; color:${color === '#f5a623' ? '#000' : '#fff'};
      cursor:pointer; transition:all 0.2s;
      position:relative;
    ">${label || (h.type === 'Digital LED' ? '●' : '')}
    ${star ? `<span style="position:absolute;top:-8px;right:-8px;font-size:10px">${star}</span>` : ''}
    </div>`;
  return L.divIcon({ html, className: '', iconSize: [size + 8, size + 8], iconAnchor: [(size + 8) / 2, (size + 8) / 2] });
}

function createPinIcon() {
  return L.divIcon({
    html: `<div style="
      width:32px; height:44px; position:relative; cursor:grab;
    ">
      <div style="
        width:26px; height:26px; background:#e74c3c; border:3px solid white;
        border-radius:50% 50% 50% 0; transform:rotate(-45deg);
        box-shadow:0 3px 12px rgba(231,76,60,0.6); margin:0 auto;
        position:absolute; top:0; left:3px;
      "></div>
      <div style="
        width:6px; height:6px; background:white; border-radius:50%;
        position:absolute; top:10px; left:13px;
      "></div>
    </div>`,
    className: '',
    iconSize: [32, 44],
    iconAnchor: [16, 42]
  });
}

function initLeafletMap(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  // Destroy existing map if container changed
  if (_leafletMap && _mapContainer !== containerId) {
    _leafletMap.remove();
    _leafletMap = null;
    _mapInitialized = false;
  }
  _mapContainer = containerId;

  if (_mapInitialized && _leafletMap) {
    refreshMapMarkers();
    return;
  }

  // Init map centered on Pune
  _leafletMap = L.map(containerId, {
    center: [AppState.mapPin.lat, AppState.mapPin.lng],
    zoom: 13,
    zoomControl: true,
    attributionControl: true
  });

  // OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(_leafletMap);

  // Pin marker (draggable)
  _pinMarker = L.marker([AppState.mapPin.lat, AppState.mapPin.lng], {
    icon: createPinIcon(),
    draggable: true,
    zIndexOffset: 1000
  }).addTo(_leafletMap);

  _pinMarker.on('dragend', (e) => {
    const pos = e.target.getLatLng();
    AppState.mapPin = { lat: parseFloat(pos.lat.toFixed(5)), lng: parseFloat(pos.lng.toFixed(5)) };
    updateRadiusCircle();
    refreshMapMarkers();
    updateMapInfoBar();
  });

  // Radius circle
  _radiusCircle = L.circle([AppState.mapPin.lat, AppState.mapPin.lng], {
    radius: AppState.radiusKm * 1000,
    color: '#f5a623',
    fillColor: '#f5a623',
    fillOpacity: 0.06,
    weight: 2,
    dashArray: '8 5'
  }).addTo(_leafletMap);

  // Click map to move pin
  _leafletMap.on('click', (e) => {
    const { lat, lng } = e.latlng;
    AppState.mapPin = { lat: parseFloat(lat.toFixed(5)), lng: parseFloat(lng.toFixed(5)) };
    _pinMarker.setLatLng([lat, lng]);
    updateRadiusCircle();
    refreshMapMarkers();
    updateMapInfoBar();
  });

  _mapInitialized = true;
  refreshMapMarkers();
}

function updateRadiusCircle() {
  if (!_radiusCircle || !_leafletMap) return;
  _radiusCircle.setLatLng([AppState.mapPin.lat, AppState.mapPin.lng]);
  _radiusCircle.setRadius(AppState.radiusKm * 1000);
}

function refreshMapMarkers() {
  if (!_leafletMap) return;
  const filtered = AppState.getFilteredHoardings();
  const filteredIds = new Set(filtered.map(h => h.id));

  // Clear old markers
  Object.values(_hoardingMarkers).forEach(m => _leafletMap.removeLayer(m));
  _hoardingMarkers = {};

  // Add all hoarding markers
  SPYDEE_DATA.hoardings.forEach(h => {
    const isSelected = AppState.selectedHoarding?.id === h.id;
    const inFilter = filteredIds.has(h.id);
    const icon = createHoardingIcon(h, isSelected);

    const marker = L.marker([h.lat, h.lng], {
      icon,
      opacity: inFilter ? 1 : 0.25
    }).addTo(_leafletMap);

    marker.bindTooltip(`
      <div style="font-family:Inter,sans-serif;min-width:180px;padding:2px">
        <strong style="font-size:13px">${h.title}</strong><br/>
        <span style="color:#aaa;font-size:11px">📍 ${h.location.split(',')[0]}</span><br/>
        <span style="font-size:12px;color:${h.status === 'available' ? '#2ecc71' : h.status === 'on-hold' ? '#f5a623' : '#e74c3c'};font-weight:700">
          ${h.status.toUpperCase()}
        </span> &nbsp;
        <span style="font-size:12px;font-weight:700;color:#f5a623">₹${(h.basePriceMonthly / 1000).toFixed(0)}K/mo</span><br/>
        <span style="font-size:11px;color:#888">${h.type} · ${h.width}×${h.height}ft · ${(h.dailyImpression / 1000).toFixed(0)}K imp/day</span>
      </div>
    `, {
      direction: 'top',
      offset: [0, -8],
      className: 'leaflet-spydee-tooltip'
    });

    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      selectHoarding(h.id);
    });

    _hoardingMarkers[h.id] = marker;
  });

  // Update pin position
  if (_pinMarker) {
    _pinMarker.setLatLng([AppState.mapPin.lat, AppState.mapPin.lng]);
  }
}

function syncRadiusSlider(val) {
  AppState.radiusKm = Number(val);
  const el = document.getElementById('radius-val');
  if (el) el.textContent = val + 'km';
  updateRadiusCircle();
  // Debounced re-filter cards
  clearTimeout(AppState._radiusTimer);
  AppState._radiusTimer = setTimeout(() => {
    refreshMapMarkers();
    refreshSidebarCards();
  }, 250);
}

function updateMapInfoBar() {
  const el = document.getElementById('map-info-bar');
  if (el) {
    const h = AppState.getFilteredHoardings();
    el.innerHTML = `📍 ${AppState.mapPin.lat.toFixed(4)}, ${AppState.mapPin.lng.toFixed(4)} &nbsp;|&nbsp; ⭕ <strong>${AppState.radiusKm}km</strong> &nbsp;|&nbsp; ${h.length} boards in range`;
  }
}

function refreshSidebarCards() {
  const container = document.getElementById('hoarding-cards');
  if (!container) return;
  const hoardings = AppState.getFilteredHoardings();
  container.innerHTML = hoardings.length === 0
    ? `<div class="empty-state">No hoardings in range.<br>Click on map to repin or expand radius.</div>`
    : hoardings.map(h => renderHoardingCard(h)).join('');
  updateMapInfoBar();
}

function mapSearch(val) {
  AppState._searchQuery = val;
  clearTimeout(AppState._searchTimer);
  AppState._searchTimer = setTimeout(() => {
    refreshSidebarCards();
    if (_leafletMap) refreshMapMarkers();
  }, 200);
}

function destroyMap() {
  if (_leafletMap) {
    try { _leafletMap.remove(); } catch(e) {}
    _leafletMap = null;
    _mapInitialized = false;
    _pinMarker = null;
    _radiusCircle = null;
    _hoardingMarkers = {};
    _mapContainer = null;
  }
}
