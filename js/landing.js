// ============================================================
// SPYDEE v3 — Landing & Auth
// ============================================================

function renderLanding() {
  return `
  <div class="landing-page">
    <nav class="nav-bar">
      <div class="nav-logo">
        <span class="logo-spider">🕷</span>
        <span class="logo-text">Spydee</span>
        <span class="logo-tagline">OOH Marketplace</span>
      </div>
      <div class="nav-actions">
        <button class="btn-ghost" onclick="showAuth('login')">Login</button>
        <button class="btn-primary" onclick="showAuth('register')">Get Started</button>
      </div>
    </nav>

    <section class="hero">
      <div class="hero-bg-grid"></div>
      <div class="hero-content">
        <div class="hero-badge animate-fade">🏙 Pune & PCMC · 15 Prime Locations</div>
        <h1 class="hero-title animate-up">
          Book Hoardings<br><span class="hero-accent">Like Ordering Food</span>
        </h1>
        <p class="hero-sub animate-up" style="animation-delay:.1s">
          India's first hyper-local OOH platform. Click map to pin location, drag circle to set radius, reserve with a 10% deposit, and go live in hours.
        </p>
        <div class="hero-ctas animate-up" style="animation-delay:.2s">
          <button class="btn-hero-primary" onclick="showAuth('register','customer')">📢 Find Hoardings</button>
          <button class="btn-hero-secondary" onclick="showAuth('register','vendor')">🏗 List Your Boards</button>
          <button class="btn-hero-tertiary" onclick="showAuth('register','printer')">🖨 Join as Printer</button>
        </div>
        <div class="hero-stats animate-up" style="animation-delay:.3s">
          <div class="stat-pill"><strong>15+</strong> Locations</div>
          <div class="stat-pill"><strong>12H</strong> Lock</div>
          <div class="stat-pill"><strong>18%</strong> GST</div>
          <div class="stat-pill"><strong>3</strong> Roles</div>
          <div class="stat-pill"><strong>Click</strong> Map Pin</div>
        </div>
      </div>
      <div class="hero-map-preview">
        <div class="map-preview-card">${renderLandingMiniMap()}</div>
      </div>
    </section>

    <section class="how-it-works">
      <h2 class="section-title">How It Works</h2>
      <div class="how-grid">
        <div class="how-card"><div class="how-icon">📍</div><h3>Click to Pin</h3><p>Click anywhere on the interactive map to set your location. Drag the circle edge to expand your search radius.</p></div>
        <div class="how-card"><div class="how-icon">🔒</div><h3>12H Reserve</h3><p>Deposit 10% to hold your board. Full refund if you cancel within 12 hours. Deposit forfeits on expiry.</p></div>
        <div class="how-card"><div class="how-icon">📄</div><h3>GST Invoice</h3><p>Auto-generated invoices with 18% GST. Multi-month bookings supported. Download-ready format.</p></div>
        <div class="how-card"><div class="how-icon">🖨</div><h3>Print & Go Live</h3><p>Order flex printing from verified Spydee printers. Track from job creation to on-site installation.</p></div>
      </div>
    </section>

    <footer class="site-footer">
      <div class="footer-logo">🕷 Spydee</div>
      <p>© 2025 Spydee OOH Marketplace · Pune, Maharashtra · GSTIN: 27AABCS1234X1ZY</p>
      <div class="demo-logins">
        <p class="demo-title">⚡ Quick Demo Login</p>
        <div class="demo-btns">
          <button onclick="quickLogin('admin@spydee.in','Admin@123')" class="demo-btn admin">⚙️ SuperAdmin</button>
          <button onclick="quickLogin('rajan@hoardings.in','Vendor@123')" class="demo-btn vendor">🏗 Vendor</button>
          <button onclick="quickLogin('nikhil@techstartup.in','Cust@123')" class="demo-btn customer">📢 Customer</button>
          <button onclick="quickLogin('print@printmaster.in','Print@123')" class="demo-btn printer">🖨 Printer</button>
        </div>
      </div>
    </footer>
  </div>`;
}

function renderLandingMiniMap() {
  const pins = SPYDEE_DATA.hoardings.slice(0,10).map(h => {
    const x = ((h.lng-73.70)/(73.97-73.70))*240+10;
    const y = ((18.72-h.lat)/(18.72-18.43))*140+10;
    const c = h.type==='Digital LED'?'#00d4b4':h.type==='Backlit'?'#f5a623':'#a29bfe';
    return `<div class="map-dot" style="left:${x}px;top:${y}px;background:${c};box-shadow:0 0 6px ${c}80" title="${h.title}"></div>`;
  }).join('');
  return `<div class="mini-map">
    <div class="mini-map-label">PUNE & PCMC</div>
    ${pins}
    <div class="mini-map-legend">
      <span style="color:#00d4b4">● Digital</span>
      <span style="color:#f5a623">● Backlit</span>
      <span style="color:#a29bfe">● Flex</span>
    </div>
  </div>`;
}

// ── Auth ──────────────────────────────────────────────────────
function showAuth(mode='login', preRole='') {
  const modal=document.getElementById('modal-overlay');
  modal.innerHTML = mode==='login' ? renderLoginForm() : renderRegisterForm(preRole);
  modal.classList.add('active');
}

function renderLoginForm() {
  return `<div class="modal-card auth-card">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="auth-header"><div class="auth-logo">🕷</div><h2>Welcome Back</h2><p>Sign in to your account</p></div>
    <form onsubmit="handleLogin(event)">
      <div class="form-group"><label>Email</label><input type="email" id="login-email" required placeholder="you@example.com"/></div>
      <div class="form-group"><label>Password</label><input type="password" id="login-pass" required placeholder="••••••••"/></div>
      <button type="submit" class="btn-form-primary">Sign In →</button>
    </form>
    <p class="auth-switch">New? <a onclick="showAuth('register')">Create account</a></p>
    <div class="auth-roles-hint">
      <p class="hint-label">Quick Demo:</p>
      <div class="hint-btns">
        <button onclick="quickLogin('admin@spydee.in','Admin@123')" class="hint-btn">Admin</button>
        <button onclick="quickLogin('rajan@hoardings.in','Vendor@123')" class="hint-btn">Vendor</button>
        <button onclick="quickLogin('nikhil@techstartup.in','Cust@123')" class="hint-btn">Customer</button>
        <button onclick="quickLogin('print@printmaster.in','Print@123')" class="hint-btn">Printer</button>
      </div>
    </div>
  </div>`;
}

function renderRegisterForm(preRole='') {
  const roles=[{v:'customer',l:'📢 Advertiser'},{v:'vendor',l:'🏗 Media Owner'},{v:'printer',l:'🖨 Flex Printer'}];
  const active = preRole||'customer';
  return `<div class="modal-card auth-card register-card">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="auth-header"><div class="auth-logo">🕷</div><h2>Join Spydee</h2><p>Create your free account</p></div>
    <form onsubmit="handleRegister(event)">
      <div class="role-selector">
        ${roles.map(r=>`<label class="role-opt ${active===r.v?'active':''}">
          <input type="radio" name="role" value="${r.v}" ${active===r.v?'checked':''} onchange="this.closest('.role-selector').querySelectorAll('.role-opt').forEach(x=>x.classList.remove('active'));this.closest('.role-opt').classList.add('active')" />
          ${r.l}
        </label>`).join('')}
      </div>
      <div class="form-row">
        <div class="form-group"><label>Full Name *</label><input id="reg-name" required placeholder="Nikhil Sharma"/></div>
        <div class="form-group"><label>Mobile *</label><input id="reg-mobile" required placeholder="98XXXXXXXX" maxlength="10"/></div>
      </div>
      <div class="form-group"><label>Email *</label><input type="email" id="reg-email" required placeholder="you@company.com"/></div>
      <div class="form-row">
        <div class="form-group"><label>Company</label><input id="reg-company" placeholder="Your Company"/></div>
        <div class="form-group"><label>GST No.</label><input id="reg-gst" placeholder="27AABCX1234Y1Z1"/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Password *</label><input type="password" id="reg-pass" required placeholder="Min 8 chars"/></div>
        <div class="form-group"><label>Confirm *</label><input type="password" id="reg-pass2" required placeholder="Repeat"/></div>
      </div>
      <button type="submit" class="btn-form-primary">Create Account & Verify Email →</button>
    </form>
    <p class="auth-switch">Already registered? <a onclick="showAuth('login')">Sign in</a></p>
  </div>`;
}

function renderOTPModal(email, otp) {
  return `<div class="modal-card auth-card" style="max-width:420px">
    <div class="auth-header"><div class="auth-logo">📧</div><h2>Verify Email</h2><p>OTP sent to <strong>${email}</strong></p></div>
    <div class="otp-demo-box">
      <p>📬 Demo OTP (shown for testing only):</p>
      <div class="otp-display">${otp}</div>
    </div>
    <form onsubmit="handleOTPVerify(event,'${email}')">
      <div class="form-group"><label>Enter 6-digit OTP</label><input id="otp-input" maxlength="6" required placeholder="000000" class="otp-input" autocomplete="one-time-code"/></div>
      <button type="submit" class="btn-form-primary">Verify & Activate →</button>
    </form>
    <p class="auth-switch" style="margin-top:12px">
      <a onclick="resendOTPDemo('${email}')">Resend OTP</a>
    </p>
  </div>`;
}

// ── Auth Handlers ─────────────────────────────────────────────
function handleLogin(e) {
  e.preventDefault();
  const result=AppState.login(document.getElementById('login-email').value, document.getElementById('login-pass').value);
  if(result.ok){ closeModal(); showToast(`Welcome, ${result.user.name}! 👋`,'success'); renderApp(); }
  else showToast(result.msg,'error');
}

function quickLogin(email,pass) {
  const result=AppState.login(email,pass);
  if(result.ok){ closeModal(); showToast(`Logged in as ${result.user.name}`,'success'); renderApp(); }
  else showToast(result.msg,'error');
}

function handleRegister(e) {
  e.preventDefault();
  const pass=document.getElementById('reg-pass').value;
  if(pass!==document.getElementById('reg-pass2').value) return showToast('Passwords do not match.','error');
  const result=AppState.register({
    role:document.querySelector('input[name="role"]:checked').value,
    name:document.getElementById('reg-name').value,
    email:document.getElementById('reg-email').value,
    mobile:document.getElementById('reg-mobile').value,
    company:document.getElementById('reg-company').value,
    gst:document.getElementById('reg-gst').value,
    password:pass
  });
  if(result.ok){
    const email=document.getElementById('reg-email').value;
    document.getElementById('modal-overlay').innerHTML=renderOTPModal(email,result.otp);
  } else showToast(result.msg,'error');
}

function handleOTPVerify(e, email) {
  e.preventDefault();
  const result=AppState.verifyOTP(email, document.getElementById('otp-input').value);
  if(result.ok){ closeModal(); showToast('✅ Email verified! Please log in.','success'); showAuth('login'); }
  else showToast(result.msg,'error');
}

function resendOTPDemo(email) {
  const otp=AppState.resendOTP(email);
  document.querySelector('.otp-display').textContent=otp;
  showToast('New OTP generated.','info');
}

function closeModal() {
  const m=document.getElementById('modal-overlay');
  m.classList.remove('active'); m.innerHTML='';
}
