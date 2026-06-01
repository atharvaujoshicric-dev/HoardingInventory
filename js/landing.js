// ============================================================
// SPYDEE - Landing & Auth Views
// ============================================================

function renderLanding() {
  return `
  <div class="landing-page">
    <!-- HERO -->
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
        <div class="hero-badge">🏙 Pune & PCMC OOH Marketplace</div>
        <h1 class="hero-title">
          Book Hoardings<br>
          <span class="hero-accent">Like Ordering Food</span>
        </h1>
        <p class="hero-sub">
          India's first hyper-local outdoor advertising platform. 
          Discover, reserve, and manage billboard campaigns across Pune & PCMC in minutes.
        </p>
        <div class="hero-ctas">
          <button class="btn-hero-primary" onclick="showAuth('register', 'customer')">
            📢 Find Hoardings
          </button>
          <button class="btn-hero-secondary" onclick="showAuth('register', 'vendor')">
            🏗 List Your Boards
          </button>
          <button class="btn-hero-tertiary" onclick="showAuth('register', 'printer')">
            🖨 Join as Printer
          </button>
        </div>
        <div class="hero-stats">
          <div class="stat-pill"><strong>15+</strong> Prime Locations</div>
          <div class="stat-pill"><strong>12H</strong> Lock Guarantee</div>
          <div class="stat-pill"><strong>3</strong> User Roles</div>
          <div class="stat-pill"><strong>18%</strong> GST Compliant</div>
        </div>
      </div>
      <div class="hero-map-preview">
        <div class="map-preview-card">
          ${renderMiniMapPreview()}
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="how-it-works">
      <h2 class="section-title">How Spydee Works</h2>
      <div class="how-grid">
        <div class="how-card">
          <div class="how-icon">📍</div>
          <h3>Discover</h3>
          <p>Browse 15+ prime hoarding locations across Pune & PCMC with real-time availability.</p>
        </div>
        <div class="how-card">
          <div class="how-icon">🔒</div>
          <h3>Reserve</h3>
          <p>Lock your chosen hoarding with a 10% deposit. 12-hour hold guarantee to finalize.</p>
        </div>
        <div class="how-card">
          <div class="how-icon">💸</div>
          <h3>Book & Pay</h3>
          <p>Convert hold to full booking. Auto-calculated GST invoices instantly.</p>
        </div>
        <div class="how-card">
          <div class="how-icon">🖨</div>
          <h3>Print & Install</h3>
          <p>Order flex printing from certified Spydee printers. Track everything end-to-end.</p>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="site-footer">
      <div class="footer-logo">🕷 Spydee</div>
      <p>© 2025 Spydee OOH Marketplace · Pune, Maharashtra</p>
      <div class="footer-links">
        <span>Pune · Pimpri-Chinchwad · Wakad · Hinjawadi · Baner</span>
      </div>
      <!-- Demo logins -->
      <div class="demo-logins">
        <p class="demo-title">⚡ Demo Quick Login</p>
        <div class="demo-btns">
          <button onclick="quickLogin('admin@spydee.in','Admin@123')" class="demo-btn admin">SuperAdmin</button>
          <button onclick="quickLogin('rajan@hoardings.in','Vendor@123')" class="demo-btn vendor">Vendor</button>
          <button onclick="quickLogin('nikhil@techstartup.in','Cust@123')" class="demo-btn customer">Customer</button>
          <button onclick="quickLogin('print@printmaster.in','Print@123')" class="demo-btn printer">Printer</button>
        </div>
      </div>
    </footer>
  </div>
  `;
}

function renderMiniMapPreview() {
  const dots = SPYDEE_DATA.hoardings.slice(0, 8).map(h => {
    // Normalize to mini canvas (150x100)
    const x = ((h.lng - 73.72) / (73.95 - 73.72)) * 220 + 15;
    const y = ((18.70 - h.lat) / (18.70 - 18.44)) * 120 + 10;
    const color = h.type === 'Digital LED' ? '#00f5d4' : h.type === 'Backlit' ? '#f5a623' : '#e74c3c';
    return `<div class="map-dot" style="left:${x}px;top:${y}px;background:${color}" title="${h.title}"></div>`;
  }).join('');
  return `
    <div class="mini-map">
      <div class="mini-map-label">Pune & PCMC</div>
      ${dots}
      <div class="mini-map-legend">
        <span style="color:#00f5d4">● Digital</span>
        <span style="color:#f5a623">● Backlit</span>
        <span style="color:#e74c3c">● Flex</span>
      </div>
    </div>
  `;
}

// ── Auth Modal ────────────────────────────────────────────────
function showAuth(mode = 'login', preRole = '') {
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = renderAuthModal(mode, preRole);
  modal.classList.add('active');
}

function renderAuthModal(mode, preRole = '') {
  if (mode === 'login') return renderLoginForm();
  return renderRegisterForm(preRole);
}

function renderLoginForm() {
  return `
  <div class="modal-card auth-card">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="auth-header">
      <div class="auth-logo">🕷</div>
      <h2>Welcome Back</h2>
      <p>Sign in to your Spydee account</p>
    </div>
    <form onsubmit="handleLogin(event)">
      <div class="form-group">
        <label>Email Address</label>
        <input type="email" id="login-email" required placeholder="you@example.com" />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="login-pass" required placeholder="••••••••" />
      </div>
      <button type="submit" class="btn-form-primary">Sign In →</button>
    </form>
    <p class="auth-switch">
      New to Spydee? <a onclick="showAuth('register')">Create account</a>
    </p>
    <div class="auth-roles-hint">
      <p class="hint-label">Quick Demo Access:</p>
      <div class="hint-btns">
        <button onclick="quickLogin('admin@spydee.in','Admin@123')" class="hint-btn">Admin</button>
        <button onclick="quickLogin('rajan@hoardings.in','Vendor@123')" class="hint-btn">Vendor</button>
        <button onclick="quickLogin('nikhil@techstartup.in','Cust@123')" class="hint-btn">Customer</button>
        <button onclick="quickLogin('print@printmaster.in','Print@123')" class="hint-btn">Printer</button>
      </div>
    </div>
  </div>`;
}

function renderRegisterForm(preRole = '') {
  return `
  <div class="modal-card auth-card register-card">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="auth-header">
      <div class="auth-logo">🕷</div>
      <h2>Join Spydee</h2>
      <p>Create your account below</p>
    </div>
    <form onsubmit="handleRegister(event)">
      <div class="role-selector">
        <label class="role-opt ${preRole === 'customer' ? 'active' : ''}">
          <input type="radio" name="role" value="customer" ${preRole === 'customer' || !preRole ? 'checked' : ''} onchange="updateRoleForm(this.value)" />
          📢 Advertiser
        </label>
        <label class="role-opt ${preRole === 'vendor' ? 'active' : ''}">
          <input type="radio" name="role" value="vendor" ${preRole === 'vendor' ? 'checked' : ''} onchange="updateRoleForm(this.value)" />
          🏗 Media Owner
        </label>
        <label class="role-opt ${preRole === 'printer' ? 'active' : ''}">
          <input type="radio" name="role" value="printer" ${preRole === 'printer' ? 'checked' : ''} onchange="updateRoleForm(this.value)" />
          🖨 Flex Printer
        </label>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="reg-name" required placeholder="Nikhil Sharma" />
        </div>
        <div class="form-group">
          <label>Mobile</label>
          <input type="tel" id="reg-mobile" required placeholder="98XXXXXXXX" maxlength="10" />
        </div>
      </div>
      <div class="form-group">
        <label>Email Address</label>
        <input type="email" id="reg-email" required placeholder="you@company.com" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Company Name</label>
          <input type="text" id="reg-company" placeholder="Your Company" />
        </div>
        <div class="form-group">
          <label>GST Number (optional)</label>
          <input type="text" id="reg-gst" placeholder="27AABCX1234Y1Z1" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="reg-pass" required placeholder="Min 8 characters" />
        </div>
        <div class="form-group">
          <label>Confirm Password</label>
          <input type="password" id="reg-pass2" required placeholder="Repeat password" />
        </div>
      </div>
      <button type="submit" class="btn-form-primary">Create Account & Verify Email →</button>
    </form>
    <p class="auth-switch">
      Already registered? <a onclick="showAuth('login')">Sign in</a>
    </p>
  </div>`;
}

function renderOTPModal(email, otp) {
  return `
  <div class="modal-card auth-card">
    <div class="auth-header">
      <div class="auth-logo">📧</div>
      <h2>Verify Your Email</h2>
      <p>OTP sent to <strong>${email}</strong></p>
    </div>
    <div class="otp-demo-box">
      <p>📬 Demo OTP (shown for testing):</p>
      <div class="otp-display">${otp}</div>
    </div>
    <form onsubmit="handleOTPVerify(event, '${email}')">
      <div class="form-group">
        <label>Enter 6-digit OTP</label>
        <input type="text" id="otp-input" maxlength="6" required placeholder="000000" class="otp-input" />
      </div>
      <button type="submit" class="btn-form-primary">Verify & Activate →</button>
    </form>
  </div>`;
}

// ── Auth Handlers ─────────────────────────────────────────────
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-pass').value;
  const result = AppState.login(email, pass);
  if (result.ok) {
    closeModal();
    showToast(`Welcome back, ${result.user.name}! 👋`, 'success');
    renderApp();
  } else {
    showToast(result.msg, 'error');
  }
}

function quickLogin(email, pass) {
  const result = AppState.login(email, pass);
  if (result.ok) {
    closeModal();
    showToast(`Logged in as ${result.user.name}`, 'success');
    renderApp();
  }
}

function handleRegister(e) {
  e.preventDefault();
  const role = document.querySelector('input[name="role"]:checked').value;
  const pass = document.getElementById('reg-pass').value;
  const pass2 = document.getElementById('reg-pass2').value;
  if (pass !== pass2) return showToast('Passwords do not match.', 'error');
  const result = AppState.register({
    role, name: document.getElementById('reg-name').value,
    email: document.getElementById('reg-email').value,
    mobile: document.getElementById('reg-mobile').value,
    company: document.getElementById('reg-company').value,
    gst: document.getElementById('reg-gst').value,
    password: pass
  });
  if (result.ok) {
    const modal = document.getElementById('modal-overlay');
    modal.innerHTML = renderOTPModal(document.getElementById('reg-email').value, result.otp);
  } else {
    showToast(result.msg, 'error');
  }
}

function handleOTPVerify(e, email) {
  e.preventDefault();
  const otp = document.getElementById('otp-input').value;
  const result = AppState.verifyOTP(email, otp);
  if (result.ok) {
    closeModal();
    showToast('Email verified! Please log in.', 'success');
    showAuth('login');
  } else {
    showToast(result.msg, 'error');
  }
}

function updateRoleForm(role) {
  document.querySelectorAll('.role-opt').forEach(el => el.classList.remove('active'));
  const selected = document.querySelector(`input[value="${role}"]`)?.closest('.role-opt');
  if (selected) selected.classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.getElementById('modal-overlay').innerHTML = '';
}
