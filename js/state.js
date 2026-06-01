// ============================================================
// SPYDEE - App State Machine & Auth Engine
// ============================================================

const AppState = {
  currentUser: null,
  currentView: 'landing',   // landing | dashboard
  dashboardTab: 'map',      // map | vendor | printer | admin
  selectedHoarding: null,
  mapPin: { lat: 18.5642, lng: 73.8482 },  // Pune center
  radiusKm: 2,
  filters: { type: 'all', minPrice: 0, maxPrice: 999999, vendor: 'all' },
  nightMode: false,
  holdTimers: {},           // hoardingId → { interval, expiry }
  pendingOTP: {},           // email → otp
  uploadedCreative: null,
  activeModal: null,

  // Persist to localStorage
  save() {
    localStorage.setItem('spydee_state', JSON.stringify({
      currentUser: this.currentUser,
      hoardings: SPYDEE_DATA.hoardings,
      users: SPYDEE_DATA.users,
      bookings: SPYDEE_DATA.bookings,
      printJobs: SPYDEE_DATA.printJobs,
      holdTimers: Object.fromEntries(
        Object.entries(this.holdTimers).map(([k, v]) => [k, { expiry: v.expiry }])
      )
    }));
  },

  load() {
    try {
      const saved = localStorage.getItem('spydee_state');
      if (!saved) return;
      const d = JSON.parse(saved);
      if (d.currentUser) this.currentUser = d.currentUser;
      if (d.hoardings) SPYDEE_DATA.hoardings = d.hoardings;
      if (d.users) SPYDEE_DATA.users = d.users;
      if (d.bookings) SPYDEE_DATA.bookings = d.bookings;
      if (d.printJobs) SPYDEE_DATA.printJobs = d.printJobs;
      // Restore hold timers
      if (d.holdTimers) {
        Object.entries(d.holdTimers).forEach(([hId, { expiry }]) => {
          if (Date.now() < expiry) {
            this.startHoldCountdown(hId, expiry);
          } else {
            // Timer expired while away — forfeit deposit
            const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
            if (h && h.status === 'on-hold') {
              this.expireHold(hId);
            }
          }
        });
      }
    } catch (e) { console.warn('State load error', e); }
  },

  // ── Auth ────────────────────────────────────────────────────
  login(email, password) {
    const user = SPYDEE_DATA.users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) return { ok: false, msg: 'Invalid email or password.' };
    if (!user.otpVerified && user.role !== 'superadmin')
      return { ok: false, msg: 'Please verify your email first.', needVerify: true, userId: user.id };
    this.currentUser = { ...user };
    this.save();
    return { ok: true, user: this.currentUser };
  },

  logout() {
    this.currentUser = null;
    this.selectedHoarding = null;
    this.uploadedCreative = null;
    this.currentView = 'landing';
    this.save();
  },

  register(data) {
    const exists = SPYDEE_DATA.users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) return { ok: false, msg: 'Email already registered.' };
    const mobileExists = SPYDEE_DATA.users.find(u => u.mobile === data.mobile);
    if (mobileExists) return { ok: false, msg: 'Mobile number already registered.' };

    const otp = generateOTP();
    const newUser = {
      id: generateId(data.role === 'vendor' ? 'V' : data.role === 'printer' ? 'P' : 'C'),
      role: data.role,
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      password: data.password,
      company: data.company || '',
      gst: data.gst || '',
      verified: false,
      otpVerified: false,
      wallet: data.role === 'customer' ? 500000 : data.role === 'vendor' ? 100000 : 50000,
      createdAt: new Date().toISOString().split('T')[0],
      ...(data.role === 'vendor' ? { inventoryIds: [] } : {}),
      ...(data.role === 'customer' ? { bookings: [], holds: [] } : {}),
      ...(data.role === 'printer' ? { acceptedJobs: [], completedJobs: [] } : {})
    };
    SPYDEE_DATA.users.push(newUser);
    this.pendingOTP[data.email] = otp;
    this.save();
    return { ok: true, userId: newUser.id, otp }; // otp shown in UI for demo
  },

  verifyOTP(email, otp) {
    if (this.pendingOTP[email] === otp) {
      const user = SPYDEE_DATA.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        user.otpVerified = true;
        user.verified = true;
        delete this.pendingOTP[email];
        this.save();
        return { ok: true };
      }
    }
    return { ok: false, msg: 'Invalid OTP.' };
  },

  // ── Hold Engine ──────────────────────────────────────────────
  reserveHoarding(hoardingId) {
    const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
    if (!h || h.status !== 'available') return { ok: false, msg: 'Not available.' };
    const user = SPYDEE_DATA.users.find(u => u.id === this.currentUser.id);
    const deposit = Math.round(h.basePriceMonthly * 0.10);
    if (user.wallet < deposit) return { ok: false, msg: 'Insufficient wallet balance.' };

    user.wallet -= deposit;
    h.status = 'on-hold';
    h.holdBy = user.id;
    h.holdDeposit = deposit;
    const expiry = Date.now() + 12 * 60 * 60 * 1000; // 12h
    h.holdExpiry = expiry;
    this.currentUser.wallet = user.wallet;

    this.startHoldCountdown(hoardingId, expiry);
    this.save();
    return { ok: true, deposit, expiry };
  },

  cancelHold(hoardingId) {
    const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
    if (!h || h.status !== 'on-hold') return { ok: false, msg: 'No active hold.' };
    const user = SPYDEE_DATA.users.find(u => u.id === h.holdBy);
    if (user) user.wallet += h.holdDeposit; // 100% refund
    h.status = 'available';
    h.holdBy = null;
    h.holdExpiry = null;

    if (this.currentUser && this.currentUser.id === user.id) {
      this.currentUser.wallet = user.wallet;
    }
    clearInterval(this.holdTimers[hoardingId]?.interval);
    delete this.holdTimers[hoardingId];
    this.save();
    return { ok: true };
  },

  startHoldCountdown(hoardingId, expiry) {
    if (this.holdTimers[hoardingId]) clearInterval(this.holdTimers[hoardingId].interval);
    const interval = setInterval(() => {
      if (Date.now() >= expiry) {
        this.expireHold(hoardingId);
        renderApp();
      } else {
        updateCountdownDisplay(hoardingId);
      }
    }, 1000);
    this.holdTimers[hoardingId] = { interval, expiry };
  },

  expireHold(hoardingId) {
    const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
    if (!h) return;
    // Forfeit deposit (split platform/owner — just remove from wallet, already deducted)
    h.status = 'available';
    h.holdBy = null;
    h.holdExpiry = null;
    clearInterval(this.holdTimers[hoardingId]?.interval);
    delete this.holdTimers[hoardingId];
    this.save();
    showToast(`⏰ Hold on ${h.title} expired. Deposit forfeited.`, 'error');
  },

  confirmBooking(hoardingId, month) {
    const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
    if (!h || h.status !== 'on-hold') return { ok: false, msg: 'No hold found.' };
    const user = SPYDEE_DATA.users.find(u => u.id === this.currentUser.id);
    if (!user) return { ok: false, msg: 'User not found.' };

    const { base, gst, deposit, totalDue } = calcTax(h.basePriceMonthly);
    if (user.wallet < totalDue) return { ok: false, msg: 'Insufficient balance for full booking.' };

    user.wallet -= totalDue;
    this.currentUser.wallet = user.wallet;

    h.status = 'booked';
    clearInterval(this.holdTimers[hoardingId]?.interval);
    delete this.holdTimers[hoardingId];

    const booking = {
      id: generateId('BK'), customerId: user.id, hoardingId,
      status: 'confirmed', month,
      basePriceMonthly: base, gst, depositPaid: deposit,
      totalDue, printJob: null,
      createdAt: new Date().toISOString().split('T')[0], proofOfPerf: null
    };
    SPYDEE_DATA.bookings.push(booking);
    if (user.bookings) user.bookings.push(booking.id);
    this.save();
    return { ok: true, booking, invoice: { base, gst, deposit, totalDue } };
  },

  // ── Vendor CRUD ──────────────────────────────────────────────
  addInventory(data) {
    const vendor = SPYDEE_DATA.users.find(u => u.id === this.currentUser.id);
    if (!vendor || vendor.role !== 'vendor') return { ok: false };
    const newH = {
      id: generateId('H'), vendorId: vendor.id,
      title: data.title, location: data.location,
      lat: data.lat || 18.5642, lng: data.lng || 73.8482,
      type: data.type, orientation: data.orientation,
      width: Number(data.width), height: Number(data.height), unit: 'ft',
      basePriceMonthly: Number(data.basePriceMonthly),
      material: data.material,
      printSpec: data.printSpec,
      illumination: data.illumination,
      traffic: data.traffic || 'Medium',
      dailyImpression: Number(data.dailyImpression) || 10000,
      images: [],
      availability: {},
      status: 'available', holdBy: null, holdExpiry: null,
      verified: false,
      gmapsLink: data.gmapsLink,
      redSquare: data.redSquare || { x: 100, y: 80, w: 400, h: 180 }
    };
    SPYDEE_DATA.hoardings.push(newH);
    vendor.inventoryIds.push(newH.id);
    if (this.currentUser.inventoryIds) this.currentUser.inventoryIds.push(newH.id);
    this.save();
    return { ok: true, hoarding: newH };
  },

  updateInventory(id, data) {
    const h = SPYDEE_DATA.hoardings.find(x => x.id === id);
    if (!h || h.vendorId !== this.currentUser.id) return { ok: false };
    Object.assign(h, data);
    this.save();
    return { ok: true };
  },

  deleteInventory(id) {
    const idx = SPYDEE_DATA.hoardings.findIndex(x => x.id === id && x.vendorId === this.currentUser.id);
    if (idx === -1) return { ok: false };
    SPYDEE_DATA.hoardings.splice(idx, 1);
    const vendor = SPYDEE_DATA.users.find(u => u.id === this.currentUser.id);
    if (vendor) vendor.inventoryIds = vendor.inventoryIds.filter(i => i !== id);
    this.save();
    return { ok: true };
  },

  // ── Print Job ─────────────────────────────────────────────────
  createPrintJob(bookingId) {
    const booking = SPYDEE_DATA.bookings.find(b => b.id === bookingId);
    if (!booking) return { ok: false };
    const h = SPYDEE_DATA.hoardings.find(x => x.id === booking.hoardingId);
    const pj = {
      id: generateId('PJ'), bookingId, hoardingId: booking.hoardingId,
      customerId: booking.customerId, printerId: null,
      status: 'open',
      dimensions: `${h.width}ft x ${h.height}ft`,
      material: h.material,
      printSpec: h.printSpec,
      artworkUrl: null,
      sla: '3 days',
      createdAt: new Date().toISOString().split('T')[0]
    };
    SPYDEE_DATA.printJobs.push(pj);
    booking.printJob = pj.id;
    this.save();
    return { ok: true, printJob: pj };
  },

  acceptPrintJob(jobId) {
    const pj = SPYDEE_DATA.printJobs.find(j => j.id === jobId);
    if (!pj || pj.status !== 'open') return { ok: false };
    pj.printerId = this.currentUser.id;
    pj.status = 'in-progress';
    const printer = SPYDEE_DATA.users.find(u => u.id === this.currentUser.id);
    if (printer) printer.acceptedJobs.push(jobId);
    this.save();
    return { ok: true };
  },

  markPrintJobDispatched(jobId) {
    const pj = SPYDEE_DATA.printJobs.find(j => j.id === jobId);
    if (!pj || pj.printerId !== this.currentUser.id) return { ok: false };
    pj.status = 'dispatched';
    const printer = SPYDEE_DATA.users.find(u => u.id === this.currentUser.id);
    if (printer) {
      printer.acceptedJobs = printer.acceptedJobs.filter(j => j !== jobId);
      printer.completedJobs.push(jobId);
    }
    this.save();
    return { ok: true };
  },

  // ── Admin helpers ─────────────────────────────────────────────
  verifyVendor(vendorId) {
    const vendor = SPYDEE_DATA.users.find(u => u.id === vendorId);
    if (vendor) { vendor.verified = true; this.save(); }
  },

  toggleHoardingVerify(hId) {
    const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
    if (h) { h.verified = !h.verified; this.save(); }
  },

  getFilteredHoardings() {
    return SPYDEE_DATA.hoardings.filter(h => {
      const dist = haversineDistance(this.mapPin.lat, this.mapPin.lng, h.lat, h.lng);
      const inRadius = dist <= this.radiusKm * 1000;
      const typeOk = this.filters.type === 'all' || h.type === this.filters.type;
      const priceOk = h.basePriceMonthly >= this.filters.minPrice && h.basePriceMonthly <= this.filters.maxPrice;
      const vendorOk = this.filters.vendor === 'all' || h.vendorId === this.filters.vendor;
      return inRadius && typeOk && priceOk && vendorOk;
    });
  }
};
