// ============================================================
// SPYDEE v3 — Vendor (Media Owner) Dashboard
// ============================================================

function renderVendorView() {
  const vendor=AppState.currentUser;
  const myInventory=SPYDEE_DATA.hoardings.filter(h=>h.vendorId===vendor.id);
  const myBookings=SPYDEE_DATA.bookings.filter(b=>myInventory.some(h=>h.id===b.hoardingId)&&b.status==='confirmed');
  const walletUser=SPYDEE_DATA.users.find(u=>u.id===vendor.id);

  return `<div class="vendor-view">
    <div class="vendor-stats-bar">
      <div class="vs-stat"><div class="vs-number">${myInventory.length}</div><div class="vs-label">Total Boards</div></div>
      <div class="vs-stat" style="border-color:var(--red)"><div class="vs-number" style="color:var(--red)">${myInventory.filter(h=>h.status==='booked').length}</div><div class="vs-label">Booked</div></div>
      <div class="vs-stat" style="border-color:var(--amber)"><div class="vs-number" style="color:var(--amber)">${myInventory.filter(h=>h.status==='on-hold').length}</div><div class="vs-label">On Hold</div></div>
      <div class="vs-stat" style="border-color:var(--green)"><div class="vs-number" style="color:var(--green)">${myInventory.filter(h=>h.status==='available').length}</div><div class="vs-label">Available</div></div>
      <div class="vs-stat"><div class="vs-number">${formatCurrency(myInventory.filter(h=>h.status==='booked').reduce((s,h)=>s+h.basePriceMonthly,0))}</div><div class="vs-label">Monthly Rev.</div></div>
      <div class="vs-stat wallet-stat"><div class="vs-number">${formatCurrency(walletUser?.wallet||0)}</div><div class="vs-label">Wallet</div></div>
      <div class="vs-stat" style="border-color:var(--teal)"><div class="vs-number" style="color:var(--teal)">${formatCurrency(walletUser?.totalEarnings||0)}</div><div class="vs-label">Total Earned</div></div>
    </div>

    <div class="vendor-content">
      <!-- LEFT: Inventory -->
      <div class="vendor-inventory-panel">
        <div class="panel-header">
          <h3>🏗 My Inventory</h3>
          <button onclick="showAddInventoryModal()" class="btn-primary btn-sm">+ Add Hoarding</button>
        </div>
        <div class="inventory-list">
          ${myInventory.length===0
            ?`<div class="empty-state">No inventory yet.<br>Add your first hoarding to start earning!</div>`
            :myInventory.map(h=>renderVendorHoardingCard(h)).join('')}
        </div>
      </div>

      <!-- RIGHT: Panels -->
      <div class="vendor-right-panel">

        <!-- Occupancy Schedule -->
        <div class="panel-box">
          <h4>📅 Occupancy Schedule</h4>
          <div class="schedule-grid">
            <div class="schedule-header"><span>Board</span>${['Jul','Aug','Sep','Oct','Nov','Dec'].map(m=>`<span>${m}</span>`).join('')}</div>
            ${myInventory.slice(0,8).map(h=>`
            <div class="schedule-row">
              <span class="sch-name" title="${h.title}">${h.title.split(' ').slice(0,2).join(' ')}</span>
              ${['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12'].map(m=>{
                const booked=SPYDEE_DATA.bookings.find(b=>b.hoardingId===h.id&&b.month===m&&b.status==='confirmed');
                const avail=h.availability?.[m];
                const cls=booked?'sch-booked':avail?'sch-available':'sch-blocked';
                return `<span class="sch-cell ${cls}" title="${m}: ${booked?'Booked':avail?'Available':'Blocked'}">${booked?'●':avail?'○':'×'}</span>`;
              }).join('')}
            </div>`).join('')}
          </div>
          <div class="schedule-legend">
            <span class="leg-booked">● Booked</span>
            <span class="leg-available">○ Available</span>
            <span class="leg-blocked">× Blocked</span>
          </div>
        </div>

        <!-- Pending Payout / Proof of Performance -->
        <div class="panel-box">
          <h4>💰 Active Bookings & Payouts</h4>
          ${myBookings.length===0?`<p class="text-muted">No active bookings right now.</p>`:
            myBookings.map(b=>{
              const h=SPYDEE_DATA.hoardings.find(x=>x.id===b.hoardingId);
              const cust=SPYDEE_DATA.users.find(u=>u.id===b.customerId);
              return `<div class="payout-card">
                <div class="pc-info"><strong>${h?.title}</strong><span>${cust?.name} · ${cust?.company||''} · ${b.month}</span></div>
                <div class="pc-amount"><span class="pc-total">${formatCurrency(b.basePriceMonthly)}</span><span class="pc-gst">+GST ${formatCurrency(b.gst)}</span></div>
                ${!b.proofOfPerf?`<div class="proof-alert">📸 Proof of Performance required
                  <button onclick="triggerProofUpload('${b.id}')" class="btn-xs-primary">Upload Photo</button>
                </div>`:`<div class="proof-done">✓ Proof Submitted
                  <button onclick="viewProofImage('${b.id}')" class="btn-xs">View</button>
                  <button onclick="deleteProofImage('${b.id}')" class="btn-xs" style="color:var(--red)">🗑</button>
                </div>`}
              </div>`;
            }).join('')}
        </div>

        <!-- Validation Log -->
        <div class="panel-box">
          <h4>📋 Inventory Validation Log</h4>
          <div class="validation-log">
            ${myInventory.map(h=>`<div class="log-entry">
              <span class="log-time">${h.status}</span>
              <span class="log-status ${h.verified?'log-ok':'log-pending'}">${h.verified?'✓':'⏳'}</span>
              <span class="log-msg">${h.title} — ${h.verified?'Admin Verified':'Pending Review'}
                ${!h.verified?`<span class="log-hint">(Submit to admin)</span>`:``}
              </span>
            </div>`).join('')}
          </div>
        </div>

      </div>
    </div>
  </div>`;
}

// ── Vendor Hoarding Card ──────────────────────────────────────
function renderVendorHoardingCard(h) {
  const sc={available:'var(--green)','on-hold':'var(--amber)',booked:'var(--red)'};
  const color=sc[h.status]||'#999';
  return `<div class="inv-card">
    <div class="inv-billboard">
      <div class="inv-bb-face ${h.type==='Digital LED'?'bb-digital':h.type==='Backlit'?'bb-backlit':'bb-flex'}"
           style="width:72px;height:36px;display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--text-muted)">
        ${h.width}×${h.height}ft
      </div>
    </div>
    <div class="inv-info">
      <div class="inv-title-row">
        <strong>${h.title}</strong>
        <span class="inv-status" style="background:${color}20;color:${color}">${h.status}</span>
      </div>
      <p class="inv-loc">📍 ${h.location.split(',')[0]}</p>
      <div class="inv-meta">${h.type} · ${h.orientation} · ${formatCurrency(h.basePriceMonthly)}/mo · ${h.dailyImpression.toLocaleString()} imp/day</div>
      <div class="inv-tags">
        <span class="spec-tag">${h.material.split(' ').slice(0,2).join(' ')}</span>
        <span class="spec-tag ${h.verified?'tag-verified':'tag-pending'}">${h.verified?'✓ Verified':'⏳ Pending'}</span>
        ${h.images?.length?`<span class="spec-tag" style="color:var(--teal)">📷 ${h.images.length} photo${h.images.length>1?'s':''}</span>`:''}
        ${h.featured?`<span class="spec-tag" style="color:var(--amber)">⭐ Featured</span>`:''}
      </div>
    </div>
    <div class="inv-actions">
      <button onclick="showEditInventoryModal('${h.id}')" class="btn-icon" title="Edit">✏️</button>
      <button onclick="showImageManager('${h.id}')" class="btn-icon" title="Photos">📷</button>
      <button onclick="showInventoryAvailModal('${h.id}')" class="btn-icon" title="Availability">📅</button>
      <button onclick="handleDeleteInventory('${h.id}')" class="btn-icon btn-icon-danger" title="Delete">🗑</button>
    </div>
  </div>`;
}

// ── Add/Edit Inventory Modal ───────────────────────────────────
function showAddInventoryModal(editId=null) {
  const h=editId?SPYDEE_DATA.hoardings.find(x=>x.id===editId):null;
  const modal=document.getElementById('modal-overlay');
  modal.innerHTML=`<div class="modal-card inventory-modal">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h2>${h?'✏️ Edit Hoarding':'+ Add New Hoarding'}</h2>

    <form onsubmit="${h?`handleUpdateInventory(event,'${editId}')`:` handleAddInventory(event)`}">
      <div class="form-row">
        <div class="form-group" style="flex:2">
          <label>Board Title *</label>
          <input id="inv-title" required value="${h?.title||''}" placeholder="Wakad Junction Mega Backlit"/>
        </div>
        <div class="form-group">
          <label>Type *</label>
          <select id="inv-type">${['Backlit','Digital LED','Flex'].map(t=>`<option ${h?.type===t?'selected':''}>${t}</option>`).join('')}</select>
        </div>
      </div>
      <div class="form-group">
        <label>Location Address *</label>
        <input id="inv-location" required value="${h?.location||''}" placeholder="Near D-Mart, Wakad Chowk, Pune - 411057"/>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Latitude</label>
          <input type="number" id="inv-lat" step="0.0001" value="${h?.lat||18.5642}"/>
        </div>
        <div class="form-group">
          <label>Longitude</label>
          <input type="number" id="inv-lng" step="0.0001" value="${h?.lng||73.8482}"/>
        </div>
      </div>
      <div class="form-group">
        <label>Google Maps Link</label>
        <input type="url" id="inv-gmaps" value="${h?.gmapsLink||''}" placeholder="https://maps.google.com/?q=18.5986,73.7611"/>
        <small class="hint">Paste Google Maps share link. Lat/Lng will be auto-extracted if provided.</small>
      </div>
      <div class="form-group">
        <label>Hoarding Position (Red Square on Street View)</label>
        <div class="red-square-editor">
          <div class="rs-backdrop" id="rs-backdrop">
            <div class="rs-overlay" id="rs-overlay"
                 style="left:${h?.redSquare?.x||100}px;top:${h?.redSquare?.y||80}px;width:${h?.redSquare?.w||400}px;height:${h?.redSquare?.h||180}px">
              <div class="rs-label">HOARDING</div>
              <div class="rs-handle rs-tl" onmousedown="rsResizeStart(event,'tl')"></div>
              <div class="rs-handle rs-tr" onmousedown="rsResizeStart(event,'tr')"></div>
              <div class="rs-handle rs-bl" onmousedown="rsResizeStart(event,'bl')"></div>
              <div class="rs-handle rs-br" onmousedown="rsResizeStart(event,'br')"></div>
            </div>
          </div>
          <p class="hint">Drag the red box to mark where the hoarding appears on a street-level photo. Drag corners to resize.</p>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Width (ft) *</label><input type="number" id="inv-width" required value="${h?.width||30}"/></div>
        <div class="form-group"><label>Height (ft) *</label><input type="number" id="inv-height" required value="${h?.height||15}"/></div>
        <div class="form-group"><label>Orientation</label>
          <select id="inv-orientation"><option ${h?.orientation==='LHS'?'selected':''}>LHS</option><option ${h?.orientation==='RHS'?'selected':''}>RHS</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Base Price/Month (₹) *</label><input type="number" id="inv-price" required value="${h?.basePriceMonthly||50000}"/></div>
        <div class="form-group"><label>Daily Impressions</label><input type="number" id="inv-imp" value="${h?.dailyImpression||15000}"/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Material</label><input id="inv-material" value="${h?.material||'Star Flex 440 GSM'}"/></div>
        <div class="form-group"><label>Illumination</label><input id="inv-illum" value="${h?.illumination||'LED Backlit 6000K'}"/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Print Specification</label><input id="inv-printspec" value="${h?.printSpec||'6x4 Solvent Print, 1440 DPI'}"/></div>
        <div class="form-group"><label>Traffic Level</label>
          <select id="inv-traffic">${['Low','Medium','High','Very High'].map(t=>`<option ${h?.traffic===t?'selected':''}>${t}</option>`).join('')}</select>
        </div>
      </div>
      <div class="modal-actions">
        <button type="submit" class="btn-form-primary">${h?'Save Changes':'Add to Inventory'}</button>
        <button type="button" onclick="closeModal()" class="btn-ghost">Cancel</button>
      </div>
    </form>
  </div>`;
  modal.classList.add('active');
  AppState._currentRedSquare=h?.redSquare||{x:100,y:80,w:400,h:180};
  initRedSquareDrag();
  // Auto-parse gmaps link
  document.getElementById('inv-gmaps')?.addEventListener('blur',parseGmapsLink);
}

function showEditInventoryModal(id) { showAddInventoryModal(id); }

function gatherInventoryForm() {
  const gmaps=document.getElementById('inv-gmaps').value;
  // Try to parse lat/lng from gmaps link
  let lat=parseFloat(document.getElementById('inv-lat').value);
  let lng=parseFloat(document.getElementById('inv-lng').value);
  const match=gmaps.match(/[?&]q=([-\d.]+),([-\d.]+)/);
  if(match){ lat=parseFloat(match[1]); lng=parseFloat(match[2]); }
  return {
    title:document.getElementById('inv-title').value,
    type:document.getElementById('inv-type').value,
    location:document.getElementById('inv-location').value,
    lat,lng,gmapsLink:gmaps,
    width:document.getElementById('inv-width').value,
    height:document.getElementById('inv-height').value,
    orientation:document.getElementById('inv-orientation').value,
    basePriceMonthly:document.getElementById('inv-price').value,
    dailyImpression:document.getElementById('inv-imp').value,
    material:document.getElementById('inv-material').value,
    illumination:document.getElementById('inv-illum').value,
    printSpec:document.getElementById('inv-printspec').value,
    traffic:document.getElementById('inv-traffic').value,
    redSquare:AppState._currentRedSquare||{x:100,y:80,w:400,h:180}
  };
}

function parseGmapsLink() {
  const val=document.getElementById('inv-gmaps').value;
  const match=val.match(/[?&@]q?=([-\d.]+),([-\d.]+)/)||val.match(/([-\d.]{5,}),([-\d.]{5,})/);
  if(match){
    document.getElementById('inv-lat').value=match[1];
    document.getElementById('inv-lng').value=match[2];
    showToast('📍 Coordinates extracted from Maps link.','success');
  }
}

function handleAddInventory(e) {
  e.preventDefault();
  const result=AppState.addInventory(gatherInventoryForm());
  if(result.ok){ closeModal(); showToast('✅ Hoarding added! Pending admin verification.','success'); renderDashboard(); }
  else showToast('Failed to add inventory.','error');
}

function handleUpdateInventory(e,id) {
  e.preventDefault();
  const result=AppState.updateInventory(id,gatherInventoryForm());
  if(result.ok){ closeModal(); showToast('✅ Hoarding updated!','success'); renderDashboard(); }
  else showToast('Update failed.','error');
}

function handleDeleteInventory(id) {
  const h=SPYDEE_DATA.hoardings.find(x=>x.id===id);
  if(h?.status==='booked') return showToast('Cannot delete a booked hoarding.','error');
  if(!confirm(`Delete "${h?.title}"? This cannot be undone.`)) return;
  const result=AppState.deleteInventory(id);
  if(result.ok){ showToast('Hoarding deleted.','success'); renderDashboard(); }
  else showToast('Delete failed.','error');
}

// ── Image Manager ─────────────────────────────────────────────
function showImageManager(hId) {
  const h=SPYDEE_DATA.hoardings.find(x=>x.id===hId);
  const modal=document.getElementById('modal-overlay');
  modal.innerHTML=`<div class="modal-card" style="max-width:540px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>📷 Photos — ${h.title}</h3>
    <div class="img-manager-grid" id="img-mgr-grid">
      ${(h.images||[]).map((img,i)=>`
      <div class="img-thumb-wrap">
        <img src="${img}" class="img-thumb"/>
        <button onclick="handleDeleteHoardingImage('${hId}',${i})" class="img-del-btn">✕</button>
      </div>`).join('')}
      ${(h.images||[]).length<6?`
      <label class="img-add-btn">
        <span>+</span><span style="font-size:11px">Add Photo</span>
        <input type="file" accept="image/*" style="display:none" onchange="handleUploadHoardingImage(event,'${hId}')"/>
      </label>`:''}
    </div>
    <p class="hint">Up to 6 photos. First image is the cover photo. Click ✕ to delete.</p>
    <button onclick="closeModal()" class="btn-form-primary">Done</button>
  </div>`;
  modal.classList.add('active');
}

function handleUploadHoardingImage(e,hId) {
  const file=e.target.files[0]; if(!file) return;
  const r=new FileReader();
  r.onload=ev=>{
    const result=AppState.uploadHoardingImage(hId,ev.target.result);
    if(result.ok){ showToast('📷 Photo added!','success'); showImageManager(hId); }
  };
  r.readAsDataURL(file);
}

function handleDeleteHoardingImage(hId,index) {
  if(!confirm('Remove this photo?')) return;
  AppState.deleteHoardingImage(hId,index);
  showToast('Photo removed.','success');
  showImageManager(hId);
}

// ── Availability Modal ────────────────────────────────────────
function showInventoryAvailModal(id) {
  const h=SPYDEE_DATA.hoardings.find(x=>x.id===id);
  const modal=document.getElementById('modal-overlay');
  const months=['2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12'];
  modal.innerHTML=`<div class="modal-card" style="max-width:460px">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>📅 Availability — ${h.title}</h3>
    <div class="avail-grid">
      ${months.map(m=>`<label class="avail-toggle">
        <input type="checkbox" ${h.availability?.[m]?'checked':''} onchange="toggleMonthAvail('${id}','${m}',this.checked)"/>
        <span class="avail-month">${m}</span>
        <span class="avail-status ${h.availability?.[m]?'avail-open':'avail-blocked'}">${h.availability?.[m]?'✓ Open':'✕ Blocked'}</span>
      </label>`).join('')}
    </div>
    <p class="hint">Toggle months open or blocked for new bookings.</p>
    <div class="modal-actions">
      <button onclick="setAllAvail('${id}',true)" class="btn-xs-primary">Open All</button>
      <button onclick="setAllAvail('${id}',false)" class="btn-xs">Block All</button>
      <button onclick="closeModal()" class="btn-form-primary" style="flex:1">Done</button>
    </div>
  </div>`;
  modal.classList.add('active');
}

function toggleMonthAvail(hId,month,val) {
  const h=SPYDEE_DATA.hoardings.find(x=>x.id===hId);
  if(h){ if(!h.availability) h.availability={}; h.availability[month]=val; AppState.save();
    // update label without full re-render
    const label=document.querySelector(`input[onchange*="${hId}"][onchange*="${month}"]`)?.closest('.avail-toggle');
    if(label){ label.querySelector('.avail-status').textContent=val?'✓ Open':'✕ Blocked';
      label.querySelector('.avail-status').className='avail-status '+(val?'avail-open':'avail-blocked'); }
  }
}

function setAllAvail(hId,val) {
  const h=SPYDEE_DATA.hoardings.find(x=>x.id===hId);
  if(h){ if(!h.availability) h.availability={};
    ['2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12'].forEach(m=>h.availability[m]=val);
    AppState.save(); showInventoryAvailModal(hId); }
}

// ── Proof of Performance ──────────────────────────────────────
function triggerProofUpload(bookingId) {
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=e=>{
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=ev=>{
      const b=SPYDEE_DATA.bookings.find(x=>x.id===bookingId);
      if(b){ b.proofOfPerf=ev.target.result; AppState.save(); }
      showToast('📸 Proof uploaded!','success'); renderDashboard();
    };
    r.readAsDataURL(f);
  };
  inp.click();
}

function viewProofImage(bookingId) {
  const b=SPYDEE_DATA.bookings.find(x=>x.id===bookingId);
  if(!b?.proofOfPerf) return;
  const modal=document.getElementById('modal-overlay');
  modal.innerHTML=`<div class="modal-card" style="max-width:520px;text-align:center">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>📸 Proof of Performance</h3>
    <img src="${b.proofOfPerf}" style="width:100%;border-radius:8px;margin-top:12px;border:1px solid var(--border)"/>
    <button onclick="closeModal()" class="btn-form-primary" style="margin-top:16px">Close</button>
  </div>`;
  modal.classList.add('active');
}

function deleteProofImage(bookingId) {
  if(!confirm('Remove proof of performance?')) return;
  const b=SPYDEE_DATA.bookings.find(x=>x.id===bookingId);
  if(b){ b.proofOfPerf=null; AppState.save(); showToast('Proof removed.','success'); renderDashboard(); }
}

// ── Red Square Drag/Resize ────────────────────────────────────
let _rsState = { mode:null, startX:0, startY:0, origRect:null };

function initRedSquareDrag() {
  setTimeout(()=>{
    const overlay=document.getElementById('rs-overlay');
    const backdrop=document.getElementById('rs-backdrop');
    if(!overlay||!backdrop) return;
    overlay.addEventListener('mousedown',e=>{
      if(e.target.classList.contains('rs-handle')) return;
      e.preventDefault();
      _rsState.mode='drag';
      _rsState.startX=e.clientX; _rsState.startY=e.clientY;
      _rsState.origRect={x:parseInt(overlay.style.left),y:parseInt(overlay.style.top),
                          w:parseInt(overlay.style.width),h:parseInt(overlay.style.height)};
    });
    document.addEventListener('mousemove',e=>{
      if(!_rsState.mode) return;
      const dx=e.clientX-_rsState.startX, dy=e.clientY-_rsState.startY;
      const bw=backdrop.clientWidth, bh=backdrop.clientHeight;
      const r=_rsState.origRect;
      if(_rsState.mode==='drag'){
        overlay.style.left=Math.max(0,Math.min(bw-r.w,r.x+dx))+'px';
        overlay.style.top=Math.max(0,Math.min(bh-r.h,r.y+dy))+'px';
      } else if(_rsState.mode==='br'){
        overlay.style.width=Math.max(40,r.w+dx)+'px';
        overlay.style.height=Math.max(20,r.h+dy)+'px';
      } else if(_rsState.mode==='tr'){
        overlay.style.width=Math.max(40,r.w+dx)+'px';
        const newH=Math.max(20,r.h-dy);
        overlay.style.height=newH+'px';
        overlay.style.top=(r.y+r.h-newH)+'px';
      } else if(_rsState.mode==='bl'){
        overlay.style.height=Math.max(20,r.h+dy)+'px';
        const newW=Math.max(40,r.w-dx);
        overlay.style.width=newW+'px';
        overlay.style.left=(r.x+r.w-newW)+'px';
      } else if(_rsState.mode==='tl'){
        const newW=Math.max(40,r.w-dx), newH=Math.max(20,r.h-dy);
        overlay.style.width=newW+'px'; overlay.style.height=newH+'px';
        overlay.style.left=(r.x+r.w-newW)+'px'; overlay.style.top=(r.y+r.h-newH)+'px';
      }
      AppState._currentRedSquare={x:parseInt(overlay.style.left),y:parseInt(overlay.style.top),
                                   w:parseInt(overlay.style.width),h:parseInt(overlay.style.height)};
    });
    document.addEventListener('mouseup',()=>{ _rsState.mode=null; });
  },100);
}

function rsResizeStart(e,corner) {
  e.preventDefault(); e.stopPropagation();
  const overlay=document.getElementById('rs-overlay');
  _rsState.mode=corner; _rsState.startX=e.clientX; _rsState.startY=e.clientY;
  _rsState.origRect={x:parseInt(overlay.style.left),y:parseInt(overlay.style.top),
                      w:parseInt(overlay.style.width),h:parseInt(overlay.style.height)};
}
