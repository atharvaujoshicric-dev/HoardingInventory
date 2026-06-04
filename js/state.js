// ============================================================
// SPYDEE v3.2 — App State Machine (All Bugs Fixed)
// ============================================================

const AppState = {
  currentUser: null,
  currentView: 'landing',
  dashboardTab: null,
  selectedHoarding: null,
  mapPin: { lat: 18.5642, lng: 73.8482 },
  radiusKm: 3,
  filters: { type:'all', minPrice:0, maxPrice:999999, vendor:'all', status:'all', traffic:'all', sort:'distance' },
  nightMode: false,
  holdTimers: {},
  pendingOTP: {},
  uploadedCreative: null,
  adminTab: 'overview',
  notifications: [],
  _currentRedSquare: null,
  _radiusTimer: null,
  _searchQuery: '',
  _activePhotoMap: {}, // hoardingId → activePhotoIdx (NOT stored in hoardings objects)

  // ── Persistence ──────────────────────────────────────────────
  save() {
    try {
      localStorage.setItem('spydee_v3', JSON.stringify({
        currentUser: this.currentUser,
        hoardings: SPYDEE_DATA.hoardings,
        users: SPYDEE_DATA.users,
        bookings: SPYDEE_DATA.bookings,
        printJobs: SPYDEE_DATA.printJobs,
        notifications: this.notifications,
        platformRevenue: SPYDEE_DATA.platformRevenue,
        holdTimers: Object.fromEntries(
          Object.entries(this.holdTimers).map(([k,v]) => [k, { expiry: v.expiry }])
        )
      }));
    } catch(e) { console.warn('Save error', e); }
  },

  load() {
    try {
      const saved = localStorage.getItem('spydee_v3');
      if (!saved) return;
      const d = JSON.parse(saved);
      if (d.currentUser) this.currentUser = d.currentUser;
      if (d.hoardings) SPYDEE_DATA.hoardings = d.hoardings;
      if (d.users) SPYDEE_DATA.users = d.users;
      if (d.bookings) SPYDEE_DATA.bookings = d.bookings;
      if (d.printJobs) SPYDEE_DATA.printJobs = d.printJobs;
      if (d.notifications) this.notifications = d.notifications;
      if (d.platformRevenue) SPYDEE_DATA.platformRevenue = d.platformRevenue;
      if (d.holdTimers) {
        Object.entries(d.holdTimers).forEach(([hId, { expiry }]) => {
          if (Date.now() < expiry) this.startHoldCountdown(hId, expiry);
          else {
            const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
            if (h && h.status === 'on-hold') this.expireHold(hId);
          }
        });
      }
    } catch(e) { console.warn('Load error', e); }
  },

  reset() { localStorage.removeItem('spydee_v3'); location.reload(); },

  // ── Auth ─────────────────────────────────────────────────────
  login(email, password) {
    const user = SPYDEE_DATA.users.find(u =>
      u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) return { ok:false, msg:'Invalid email or password.' };
    if (user.suspended) return { ok:false, msg:'Your account has been suspended. Contact support.' };
    if (!user.otpVerified && user.role !== 'superadmin')
      return { ok:false, msg:'Please verify your email OTP first.', needVerify: true };
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastActive = new Date().toISOString();
    this.currentUser = JSON.parse(JSON.stringify(user));
    this.dashboardTab = null;
    this.save();
    return { ok:true, user: this.currentUser };
  },

  logout() {
    this.currentUser = null; this.selectedHoarding = null;
    this.uploadedCreative = null; this.currentView = 'landing';
    this.dashboardTab = null; this._activePhotoMap = {};
    this.save();
  },

  register(data) {
    if (SPYDEE_DATA.users.find(u => u.email.toLowerCase() === data.email.toLowerCase()))
      return { ok:false, msg:'Email already registered.' };
    if (SPYDEE_DATA.users.find(u => u.mobile === data.mobile))
      return { ok:false, msg:'Mobile number already registered.' };
    const otp = generateOTP();
    const newUser = {
      id: generateId(data.role === 'vendor' ? 'V' : data.role === 'printer' ? 'P' : 'C'),
      role: data.role, name: data.name, email: data.email, mobile: data.mobile,
      password: data.password, company: data.company || '', gst: data.gst || '',
      verified: false, otpVerified: false, suspended: false,
      wallet: data.role === 'customer' ? 300000 : data.role === 'vendor' ? 100000 : 50000,
      createdAt: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString(), loginCount: 0,
      ...(data.role === 'vendor' ? { inventoryIds:[], rating:0, reviewCount:0, totalEarnings:0 } : {}),
      ...(data.role === 'customer' ? { bookings:[], holds:[], totalSpend:0 } : {}),
      ...(data.role === 'printer' ? { acceptedJobs:[], completedJobs:[], totalEarnings:0, rating:0, reviewCount:0 } : {})
    };
    SPYDEE_DATA.users.push(newUser);
    this.pendingOTP[data.email.toLowerCase()] = otp;
    this.save();
    return { ok:true, userId: newUser.id, otp };
  },

  verifyOTP(email, otp) {
    const key = email.toLowerCase();
    if (this.pendingOTP[key] === otp) {
      const user = SPYDEE_DATA.users.find(u => u.email.toLowerCase() === key);
      if (user) {
        user.otpVerified = true; user.verified = true;
        delete this.pendingOTP[key]; this.save();
        return { ok:true };
      }
    }
    return { ok:false, msg:'Invalid OTP. Please try again.' };
  },

  resendOTP(email) {
    const otp = generateOTP();
    this.pendingOTP[email.toLowerCase()] = otp;
    return otp;
  },

  // ── BUG FIX #9: Reserve deducts deposit; confirmBooking deducts REMAINING balance only
  reserveHoarding(hoardingId) {
    const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
    if (!h || h.status !== 'available') return { ok:false, msg:'This hoarding is not available.' };
    // FIX #18: Vendor cannot reserve their own hoarding
    if (h.vendorId === this.currentUser.id) return { ok:false, msg:'You cannot reserve your own hoarding.' };
    // FIX #13: Cannot reserve unverified hoarding
    if (!h.verified) return { ok:false, msg:'This hoarding is pending admin verification.' };
    const user = SPYDEE_DATA.users.find(u => u.id === this.currentUser.id);
    const deposit = Math.round(h.basePriceMonthly * 0.10);
    if (user.wallet < deposit) return { ok:false, msg:`Insufficient wallet. Need ${formatCurrency(deposit)} for deposit.` };
    user.wallet -= deposit;
    h.status = 'on-hold'; h.holdBy = user.id; h.holdDeposit = deposit;
    const expiry = Date.now() + 12 * 60 * 60 * 1000;
    h.holdExpiry = expiry;
    this.currentUser.wallet = user.wallet;
    this.startHoldCountdown(hoardingId, expiry);
    this.addNotification(user.id, '🔒 Hold Placed',
      `${h.title} is reserved for 12 hours. Deposit: ${formatCurrency(deposit)}.`, 'info');
    this.addNotification(h.vendorId, '🔒 Hold on Your Board',
      `${user.name} placed a 12-hour hold on "${h.title}".`, 'info');
    this.save();
    return { ok:true, deposit, expiry };
  },

  cancelHold(hoardingId) {
    const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
    if (!h || h.status !== 'on-hold') return { ok:false, msg:'No active hold.' };
    const user = SPYDEE_DATA.users.find(u => u.id === h.holdBy);
    const refund = h.holdDeposit || 0; // capture BEFORE clearing
    if (user) user.wallet += refund;
    h.status = 'available'; h.holdBy = null; h.holdExpiry = null; h.holdDeposit = 0;
    if (this.currentUser?.id === user?.id) this.currentUser.wallet = user.wallet;
    clearInterval(this.holdTimers[hoardingId]?.interval);
    delete this.holdTimers[hoardingId];
    this.save();
    return { ok:true, refund };
  },

  startHoldCountdown(hoardingId, expiry) {
    if (this.holdTimers[hoardingId]) clearInterval(this.holdTimers[hoardingId].interval);
    const interval = setInterval(() => {
      if (Date.now() >= expiry) {
        this.expireHold(hoardingId);
        // FIX #8: only call renderApp if DOM is ready
        if (document.getElementById('dash-main')) renderApp();
      } else {
        // FIX #8: safely update countdown display
        if (document.getElementById('dash-main')) updateCountdownDisplay(hoardingId);
      }
    }, 1000);
    this.holdTimers[hoardingId] = { interval, expiry };
  },

  expireHold(hoardingId) {
    const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
    if (!h) return;
    const deposit = h.holdDeposit || 0;
    const vendor = SPYDEE_DATA.users.find(u => u.id === h.vendorId);
    if (vendor) {
      vendor.totalEarnings = (vendor.totalEarnings || 0) + Math.round(deposit * 0.4);
      vendor.wallet = (vendor.wallet || 0) + Math.round(deposit * 0.4);
    }
    SPYDEE_DATA.platformRevenue = (SPYDEE_DATA.platformRevenue || 0) + Math.round(deposit * 0.6);
    h.status = 'available'; h.holdBy = null; h.holdExpiry = null; h.holdDeposit = 0;
    clearInterval(this.holdTimers[hoardingId]?.interval);
    delete this.holdTimers[hoardingId];
    this.save();
    if (typeof showToast === 'function') showToast(`⏰ Hold on "${h.title}" expired. Deposit forfeited.`, 'error');
  },

  // FIX #9: confirmBooking charges REMAINING balance (totalDue already nets out deposit)
  // FIX #4: validate month against availability
  // FIX #2: vendor.wallet credited correctly
  confirmBooking(hoardingId, month, durationMonths = 1) {
    const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
    if (!h || h.status !== 'on-hold') return { ok:false, msg:'No active hold. Please reserve first.' };
    const user = SPYDEE_DATA.users.find(u => u.id === this.currentUser.id);
    if (!user) return { ok:false, msg:'User not found.' };
    if (h.holdBy !== user.id) return { ok:false, msg:'This hold belongs to someone else.' };
    // FIX #4: validate availability
    if (h.availability && h.availability[month] === false)
      return { ok:false, msg:`${month} is blocked by the media owner. Choose another month.` };
    const { base, gst, deposit } = calcTax(h.basePriceMonthly * durationMonths);
    // FIX #9: customer already paid deposit; only charge the remaining balance
    const balanceDue = base + gst - deposit; // deposit already deducted from wallet at reserve time
    if (user.wallet < balanceDue)
      return { ok:false, msg:`Insufficient balance. Need ${formatCurrency(balanceDue)} more.` };
    user.wallet -= balanceDue;
    user.totalSpend = (user.totalSpend || 0) + (base + gst); // full amount as spend
    this.currentUser.wallet = user.wallet;
    h.status = 'booked';
    // FIX #5: mark availability for all booked months
    if (!h.availability) h.availability = {};
    for (let i = 0; i < durationMonths; i++) {
      const d = new Date(month + '-01');
      d.setMonth(d.getMonth() + i);
      const mk = d.toISOString().slice(0, 7);
      h.availability[mk] = false;
    }
    clearInterval(this.holdTimers[hoardingId]?.interval);
    delete this.holdTimers[hoardingId];
    const totalPaid = base + gst; // total customer paid (deposit + balance)
    const booking = {
      id: generateId('BK'), customerId: user.id, hoardingId,
      vendorId: h.vendorId, status: 'confirmed', month,
      durationMonths, basePriceMonthly: h.basePriceMonthly,
      gst, depositPaid: deposit, totalPaid, balanceDue,
      printJob: null, createdAt: new Date().toISOString().split('T')[0],
      proofOfPerf: null, rating: null, review: null, ratedAt: null
    };
    SPYDEE_DATA.bookings.push(booking);
    if (user.bookings) user.bookings.push(booking.id);
    // FIX #2: credit vendor wallet (85% of total paid)
    const vendor = SPYDEE_DATA.users.find(u => u.id === h.vendorId);
    const vendorShare = Math.round(totalPaid * 0.85);
    if (vendor) {
      vendor.wallet = (vendor.wallet || 0) + vendorShare;
      vendor.totalEarnings = (vendor.totalEarnings || 0) + vendorShare;
    }
    SPYDEE_DATA.platformRevenue = (SPYDEE_DATA.platformRevenue || 0) + Math.round(totalPaid * 0.15);
    this.addNotification(user.id, '🎉 Booking Confirmed!',
      `"${h.title}" booked for ${month}. Total paid: ${formatCurrency(totalPaid)}.`, 'success');
    this.addNotification(h.vendorId, '💰 New Booking!',
      `${user.name} (${user.mobile}) confirmed "${h.title}" for ${month}. Your share: ${formatCurrency(vendorShare)}.`, 'success');
    this.save();
    return { ok:true, booking, invoice:{ base, gst, deposit, balanceDue, totalPaid } };
  },

  // FIX #15: prevent cancel if print job dispatched
  // FIX #6: refund = 50% of (base+gst) - deposit already gone
  cancelBooking(bookingId) {
    const b = SPYDEE_DATA.bookings.find(x => x.id === bookingId);
    if (!b || b.status !== 'confirmed') return { ok:false, msg:'Cannot cancel this booking.' };
    // FIX #15: check print job
    if (b.printJob) {
      const pj = SPYDEE_DATA.printJobs.find(j => j.id === b.printJob);
      if (pj && pj.status === 'dispatched')
        return { ok:false, msg:'Cannot cancel after the print job has been dispatched.' };
    }
    // FIX #6: 50% of balanceDue (not totalPaid — deposit is already forfeited terms)
    const refund = Math.round((b.balanceDue || b.totalDue || 0) * 0.5);
    const user = SPYDEE_DATA.users.find(u => u.id === b.customerId);
    if (user) user.wallet += refund;
    b.status = 'cancelled';
    const h = SPYDEE_DATA.hoardings.find(x => x.id === b.hoardingId);
    if (h) { h.status = 'available'; h.holdBy = null; h.holdExpiry = null; }
    // Restore availability for cancelled months
    if (h && h.availability) {
      for (let i = 0; i < (b.durationMonths || 1); i++) {
        const d = new Date(b.month + '-01'); d.setMonth(d.getMonth() + i);
        const mk = d.toISOString().slice(0, 7);
        h.availability[mk] = true;
      }
    }
    if (this.currentUser?.id === user?.id) this.currentUser.wallet = user.wallet;
    // Claw back vendor share
    const vendor = SPYDEE_DATA.users.find(u => u.id === b.vendorId);
    if (vendor) {
      const clawback = Math.round((b.balanceDue || 0) * 0.5 * 0.85);
      vendor.wallet = Math.max(0, (vendor.wallet || 0) - clawback);
      vendor.totalEarnings = Math.max(0, (vendor.totalEarnings || 0) - clawback);
    }
    this.addNotification(b.vendorId, '❌ Booking Cancelled',
      `Booking for "${h?.title}" by ${user?.name} was cancelled. Board is now available.`, 'error');
    this.save();
    return { ok:true, refund };
  },

  // FIX #14: prevent re-rating same booking
  rateBooking(bookingId, rating, review) {
    const b = SPYDEE_DATA.bookings.find(x => x.id === bookingId);
    if (!b) return { ok:false };
    if (b.ratedAt) return { ok:false, msg:'You have already rated this booking.' };
    b.rating = rating; b.review = review;
    b.ratingDate = new Date().toISOString().split('T')[0];
    b.ratedAt = new Date().toISOString();
    const h = SPYDEE_DATA.hoardings.find(x => x.id === b.hoardingId);
    if (h) {
      const total = (h.rating || 0) * (h.reviewCount || 0) + rating;
      h.reviewCount = (h.reviewCount || 0) + 1;
      h.rating = total / h.reviewCount;
    }
    this.addNotification(b.vendorId, '⭐ New Review',
      `${SPYDEE_DATA.users.find(u=>u.id===b.customerId)?.name} rated "${h?.title}" ${rating}/5.`, 'info');
    this.save();
    return { ok:true };
  },

  // ── Vendor Inventory CRUD ─────────────────────────────────────
  addInventory(data) {
    const vendor = SPYDEE_DATA.users.find(u => u.id === this.currentUser.id);
    if (!vendor || vendor.role !== 'vendor') return { ok:false };
    const newH = {
      id: generateId('H'), vendorId: vendor.id,
      title: data.title, location: data.location,
      lat: parseFloat(data.lat) || 18.5642, lng: parseFloat(data.lng) || 73.8482,
      type: data.type, orientation: data.orientation,
      width: Number(data.width), height: Number(data.height), unit: 'ft',
      basePriceMonthly: Number(data.basePriceMonthly),
      material: data.material, printSpec: data.printSpec, illumination: data.illumination,
      traffic: data.traffic || 'Medium',
      dailyImpression: Number(data.dailyImpression) || 10000,
      images: [], availability: {}, status: 'available',
      holdBy: null, holdExpiry: null, holdDeposit: 0,
      verified: false, gmapsLink: data.gmapsLink || '',
      redSquare: data.redSquare || null,
      rating: 0, reviewCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    SPYDEE_DATA.hoardings.push(newH);
    if (!vendor.inventoryIds) vendor.inventoryIds = [];
    vendor.inventoryIds.push(newH.id);
    if (this.currentUser.inventoryIds) this.currentUser.inventoryIds.push(newH.id);
    this.addNotification('SA001', '🏗 New Hoarding Submitted',
      `${vendor.name} submitted "${newH.title}" for verification.`, 'info');
    this.save();
    return { ok:true, hoarding: newH };
  },

  updateInventory(id, data) {
    const h = SPYDEE_DATA.hoardings.find(x => x.id === id);
    if (!h) return { ok:false };
    if (this.currentUser.role !== 'superadmin' && h.vendorId !== this.currentUser.id) return { ok:false };
    Object.assign(h, data);
    this.save();
    return { ok:true };
  },

  // FIX #16: cannot delete hoarding with active hold
  deleteInventory(id) {
    const h = SPYDEE_DATA.hoardings.find(x => x.id === id);
    if (!h) return { ok:false };
    if (this.currentUser.role !== 'superadmin' && h.vendorId !== this.currentUser.id) return { ok:false };
    if (h.status === 'booked') return { ok:false, msg:'Cannot delete a booked hoarding.' };
    if (h.status === 'on-hold') return { ok:false, msg:'Cannot delete a hoarding that has an active hold. Wait for it to expire or cancel the hold first.' };
    SPYDEE_DATA.hoardings = SPYDEE_DATA.hoardings.filter(x => x.id !== id);
    const vendor = SPYDEE_DATA.users.find(u => u.id === h.vendorId);
    if (vendor) vendor.inventoryIds = vendor.inventoryIds.filter(i => i !== id);
    this.save();
    return { ok:true };
  },

  uploadHoardingImage(hoardingId, dataUrl) {
    const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
    if (!h) return { ok:false };
    if (!h.images) h.images = [];
    h.images.push(dataUrl);
    this.save();
    return { ok:true, index: h.images.length - 1 };
  },

  deleteHoardingImage(hoardingId, index) {
    const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
    if (!h || !h.images) return { ok:false };
    h.images.splice(index, 1);
    this.save();
    return { ok:true };
  },

  // ── Print Jobs ─────────────────────────────────────────────────
  createPrintJob(bookingId) {
    const booking = SPYDEE_DATA.bookings.find(b => b.id === bookingId);
    if (!booking) return { ok:false };
    if (booking.printJob) return { ok:false, msg:'Print job already exists for this booking.' };
    const h = SPYDEE_DATA.hoardings.find(x => x.id === booking.hoardingId);
    const customer = SPYDEE_DATA.users.find(u => u.id === booking.customerId);
    const pj = {
      id: generateId('PJ'), bookingId, hoardingId: booking.hoardingId,
      customerId: booking.customerId, vendorId: booking.vendorId,
      printerId: null, status: 'open',
      dimensions: `${h.width}ft × ${h.height}ft`,
      material: h.material, printSpec: h.printSpec,
      artworkUrl: null, sla: '3 days', priority: 'normal',
      priceQuote: Math.round(h.width * h.height * 12),
      deliveryAddress: customer?.company ? `${customer.name}, ${customer.company}` : customer?.name || '',
      createdAt: new Date().toISOString().split('T')[0],
      acceptedAt: null, dispatchedAt: null, trackingNote: ''
    };
    SPYDEE_DATA.printJobs.push(pj);
    booking.printJob = pj.id;
    this.addNotification(booking.customerId, '🖨 Print Job Created',
      `Job ${pj.id} posted to printers for "${h.title}".`, 'info');
    this.save();
    return { ok:true, printJob: pj };
  },

  acceptPrintJob(jobId) {
    const pj = SPYDEE_DATA.printJobs.find(j => j.id === jobId);
    if (!pj || pj.status !== 'open') return { ok:false, msg:'Job not available.' };
    pj.printerId = this.currentUser.id;
    pj.status = 'in-progress';
    pj.acceptedAt = new Date().toISOString().split('T')[0];
    const printer = SPYDEE_DATA.users.find(u => u.id === this.currentUser.id);
    if (printer?.acceptedJobs) printer.acceptedJobs.push(jobId);
    this.addNotification(pj.customerId, '✅ Printer Accepted',
      `Your print job ${jobId} is now in progress.`, 'success');
    this.save();
    return { ok:true };
  },

  markPrintJobDispatched(jobId, trackingNote) {
    const pj = SPYDEE_DATA.printJobs.find(j => j.id === jobId);
    if (!pj || pj.printerId !== this.currentUser.id) return { ok:false };
    pj.status = 'dispatched';
    pj.dispatchedAt = new Date().toISOString().split('T')[0];
    pj.trackingNote = trackingNote || '';
    const printer = SPYDEE_DATA.users.find(u => u.id === this.currentUser.id);
    if (printer) {
      printer.acceptedJobs = (printer.acceptedJobs || []).filter(j => j !== jobId);
      if (!printer.completedJobs) printer.completedJobs = [];
      printer.completedJobs.push(jobId);
      printer.totalEarnings = (printer.totalEarnings || 0) + (pj.priceQuote || 0);
      printer.wallet = (printer.wallet || 0) + (pj.priceQuote || 0);
    }
    this.addNotification(pj.customerId, '🚚 Print Dispatched!',
      `Job ${jobId} dispatched. ${trackingNote || 'Check tracking for updates.'}`, 'success');
    this.save();
    return { ok:true };
  },

  updatePrintJobArtwork(jobId, artworkUrl) {
    const pj = SPYDEE_DATA.printJobs.find(j => j.id === jobId);
    if (!pj) return { ok:false };
    pj.artworkUrl = artworkUrl; this.save(); return { ok:true };
  },

  deletePrintJobArtwork(jobId) {
    const pj = SPYDEE_DATA.printJobs.find(j => j.id === jobId);
    if (!pj) return { ok:false };
    pj.artworkUrl = null; this.save(); return { ok:true };
  },

  // ── Admin Powers ──────────────────────────────────────────────
  adminUpdateUser(userId, fields) {
    const user = SPYDEE_DATA.users.find(u => u.id === userId);
    if (!user) return { ok:false };
    Object.assign(user, fields);
    this.save(); return { ok:true };
  },

  adminSuspendUser(userId) {
    const user = SPYDEE_DATA.users.find(u => u.id === userId);
    if (!user || user.role === 'superadmin') return { ok:false };
    user.suspended = !user.suspended;
    // FIX #17: only notify non-suspended users
    if (!user.suspended) {
      this.addNotification(userId, '✅ Account Reinstated', 'Your account has been reinstated.', 'success');
    }
    this.save(); return { ok:true, suspended: user.suspended };
  },

  adminDeleteUser(userId) {
    const idx = SPYDEE_DATA.users.findIndex(u => u.id === userId);
    if (idx === -1) return { ok:false };
    SPYDEE_DATA.users.splice(idx, 1);
    this.save(); return { ok:true };
  },

  adminTopUpWallet(userId, amount) {
    const user = SPYDEE_DATA.users.find(u => u.id === userId);
    if (!user) return { ok:false };
    user.wallet = (user.wallet || 0) + Number(amount);
    if (this.currentUser?.id === userId) this.currentUser.wallet = user.wallet;
    this.addNotification(userId, '💳 Wallet Credited',
      `${formatCurrency(amount)} has been added to your wallet by admin.`, 'success');
    this.save(); return { ok:true, newBalance: user.wallet };
  },

  adminForceVerify(userId) {
    const user = SPYDEE_DATA.users.find(u => u.id === userId);
    if (!user) return { ok:false };
    user.verified = true; user.otpVerified = true;
    this.addNotification(userId, '✅ Account Verified', 'Your account has been verified by admin.', 'success');
    this.save(); return { ok:true };
  },

  adminUpdateBooking(bookingId, fields) {
    const b = SPYDEE_DATA.bookings.find(x => x.id === bookingId);
    if (!b) return { ok:false };
    Object.assign(b, fields); this.save(); return { ok:true };
  },

  adminCancelBooking(bookingId) {
    const b = SPYDEE_DATA.bookings.find(x => x.id === bookingId);
    if (!b) return { ok:false };
    b.status = 'cancelled-admin';
    const h = SPYDEE_DATA.hoardings.find(x => x.id === b.hoardingId);
    if (h) { h.status = 'available'; h.holdBy = null; h.holdExpiry = null; }
    this.addNotification(b.customerId, '❌ Booking Cancelled by Admin',
      `Your booking for "${h?.title}" was cancelled by admin.`, 'error');
    this.save(); return { ok:true };
  },

  adminDeleteHoarding(hId) {
    const idx = SPYDEE_DATA.hoardings.findIndex(x => x.id === hId);
    if (idx === -1) return { ok:false };
    SPYDEE_DATA.hoardings.splice(idx, 1);
    this.save(); return { ok:true };
  },

  adminAdjustPrice(hId, newPrice) {
    const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
    if (!h) return { ok:false };
    h.basePriceMonthly = Number(newPrice);
    this.save(); return { ok:true };
  },

  adminAssignPrinter(jobId, printerId) {
    const pj = SPYDEE_DATA.printJobs.find(j => j.id === jobId);
    if (!pj) return { ok:false };
    pj.printerId = printerId || null;
    if (printerId) { pj.status = 'in-progress'; pj.acceptedAt = new Date().toISOString().split('T')[0]; }
    this.save(); return { ok:true };
  },

  toggleHoardingVerify(hId) {
    const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
    if (!h) return;
    h.verified = !h.verified;
    if (h.verified) {
      this.addNotification(h.vendorId, '✅ Hoarding Verified!',
        `"${h.title}" is now verified and visible to all customers.`, 'success');
    } else {
      this.addNotification(h.vendorId, '⏳ Verification Revoked',
        `"${h.title}" has been unverified and hidden from customers.`, 'error');
    }
    this.save();
  },

  toggleHoardingFeatured(hId) {
    const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
    if (h) { h.featured = !h.featured; this.save(); }
  },

  // ── Notifications ──────────────────────────────────────────────
  addNotification(userId, title, message, type = 'info') {
    this.notifications.push({
      id: generateId('N'), userId, title, message, type,
      read: false, createdAt: new Date().toISOString()
    });
  },

  markNotifRead(notifId) {
    const n = this.notifications.find(x => x.id === notifId);
    if (n) { n.read = true; this.save(); }
  },

  markAllNotifRead() {
    this.notifications.filter(n => n.userId === this.currentUser?.id).forEach(n => n.read = true);
    this.save();
  },

  getMyNotifications() {
    return this.notifications
      .filter(n => n.userId === this.currentUser?.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 30);
  },

  getUnreadCount() {
    return this.notifications.filter(n => n.userId === this.currentUser?.id && !n.read).length;
  },

  // FIX #17: don't broadcast to suspended users
  broadcastNotification(target, title, message) {
    const users = target === 'all'
      ? SPYDEE_DATA.users.filter(u => !u.suspended)
      : SPYDEE_DATA.users.filter(u => u.role === target && !u.suspended);
    users.forEach(u => this.addNotification(u.id, title, message, 'info'));
    this.save();
  },

  // FIX #3 + #19: filter unverified hoardings for customers; add sort
  getFilteredHoardings() {
    const q = this._searchQuery.toLowerCase().trim();
    const role = this.currentUser?.role;
    let results = SPYDEE_DATA.hoardings.filter(h => {
      // FIX #3: hide unverified from customers
      if (role === 'customer' && !h.verified) return false;
      if (haversineDistance(this.mapPin.lat, this.mapPin.lng, h.lat, h.lng) > this.radiusKm * 1000) return false;
      if (this.filters.type !== 'all' && h.type !== this.filters.type) return false;
      if (h.basePriceMonthly < this.filters.minPrice || h.basePriceMonthly > this.filters.maxPrice) return false;
      if (this.filters.vendor !== 'all' && h.vendorId !== this.filters.vendor) return false;
      if (this.filters.status !== 'all' && h.status !== this.filters.status) return false;
      if (this.filters.traffic !== 'all' && h.traffic !== this.filters.traffic) return false;
      if (q && !h.title.toLowerCase().includes(q) && !h.location.toLowerCase().includes(q)) return false;
      return true;
    });
    // FIX #19: sorting
    const sort = this.filters.sort || 'distance';
    if (sort === 'price-asc') results.sort((a,b) => a.basePriceMonthly - b.basePriceMonthly);
    else if (sort === 'price-desc') results.sort((a,b) => b.basePriceMonthly - a.basePriceMonthly);
    else if (sort === 'impressions') results.sort((a,b) => b.dailyImpression - a.dailyImpression);
    else if (sort === 'rating') results.sort((a,b) => (b.rating||0) - (a.rating||0));
    else results.sort((a,b) =>
      haversineDistance(this.mapPin.lat,this.mapPin.lng,a.lat,a.lng) -
      haversineDistance(this.mapPin.lat,this.mapPin.lng,b.lat,b.lng)
    );
    return results;
  },

  getRevenueData() {
    const months = ['2025-03','2025-04','2025-05','2025-06',
                    '2025-07','2025-08','2025-09','2025-10','2025-11'];
    return months.map(m => ({
      month: m,
      revenue: SPYDEE_DATA.bookings
        .filter(b => b.month === m && b.status === 'confirmed')
        .reduce((s, b) => s + (b.basePriceMonthly * (b.durationMonths||1)), 0),
      bookings: SPYDEE_DATA.bookings.filter(b => b.month === m).length
    }));
  }
};

// ============================================================
// SPYDEE v3.2 — Messaging, Enquiry, Waitlist, Payout Extensions
// ============================================================

// Patch save/load for new data collections
const _origSave = AppState.save.bind(AppState);
AppState.save = function() {
  try {
    const base = JSON.parse(localStorage.getItem('spydee_v3') || '{}');
    base.messages = SPYDEE_DATA.messages;
    base.enquiries = SPYDEE_DATA.enquiries;
    base.waitlists = SPYDEE_DATA.waitlists;
    base.payoutRequests = SPYDEE_DATA.payoutRequests;
    // Persist all core data
    base.currentUser = this.currentUser;
    base.hoardings = SPYDEE_DATA.hoardings;
    base.users = SPYDEE_DATA.users;
    base.bookings = SPYDEE_DATA.bookings;
    base.printJobs = SPYDEE_DATA.printJobs;
    base.notifications = this.notifications;
    base.platformRevenue = SPYDEE_DATA.platformRevenue;
    base.holdTimers = Object.fromEntries(
      Object.entries(this.holdTimers).map(([k,v]) => [k, { expiry: v.expiry }])
    );
    localStorage.setItem('spydee_v3', JSON.stringify(base));
  } catch(e) { console.warn('Save error', e); }
};

const _origLoad = AppState.load.bind(AppState);
AppState.load = function() {
  try {
    const saved = localStorage.getItem('spydee_v3');
    if (!saved) return;
    const d = JSON.parse(saved);
    if (d.currentUser) this.currentUser = d.currentUser;
    if (d.hoardings) SPYDEE_DATA.hoardings = d.hoardings;
    if (d.users) SPYDEE_DATA.users = d.users;
    if (d.bookings) SPYDEE_DATA.bookings = d.bookings;
    if (d.printJobs) SPYDEE_DATA.printJobs = d.printJobs;
    if (d.notifications) this.notifications = d.notifications;
    if (d.platformRevenue) SPYDEE_DATA.platformRevenue = d.platformRevenue;
    if (d.messages) SPYDEE_DATA.messages = d.messages;
    if (d.enquiries) SPYDEE_DATA.enquiries = d.enquiries;
    if (d.waitlists) SPYDEE_DATA.waitlists = d.waitlists;
    if (d.payoutRequests) SPYDEE_DATA.payoutRequests = d.payoutRequests;
    if (d.holdTimers) {
      Object.entries(d.holdTimers).forEach(([hId, { expiry }]) => {
        if (Date.now() < expiry) this.startHoldCountdown(hId, expiry);
        else {
          const h = SPYDEE_DATA.hoardings.find(x => x.id === hId);
          if (h && h.status === 'on-hold') this.expireHold(hId);
        }
      });
    }
  } catch(e) { console.warn('Load error', e); }
};

// ── IN-APP MESSAGING (post-booking only, all on platform) ────
AppState.sendMessage = function(bookingId, text) {
  const b = SPYDEE_DATA.bookings.find(x => x.id === bookingId);
  if (!b) return { ok:false, msg:'Booking not found.' };
  const uid = this.currentUser.id;
  // Only customer or vendor of this booking can message
  if (uid !== b.customerId && uid !== b.vendorId)
    return { ok:false, msg:'Not authorized.' };
  const toId = uid === b.customerId ? b.vendorId : b.customerId;
  const msg = {
    id: generateId('MSG'), bookingId, hoardingId: b.hoardingId,
    fromId: uid, toId, text: text.trim(),
    ts: new Date().toISOString(), read: false
  };
  SPYDEE_DATA.messages.push(msg);
  const h = SPYDEE_DATA.hoardings.find(x => x.id === b.hoardingId);
  const fromName = this.currentUser.name;
  this.addNotification(toId, '💬 New Message',
    `${fromName}: "${text.slice(0,60)}${text.length>60?'…':''}"`, 'info');
  this.save();
  return { ok:true, msg };
};

AppState.getConversation = function(bookingId) {
  return SPYDEE_DATA.messages
    .filter(m => m.bookingId === bookingId)
    .sort((a,b) => new Date(a.ts) - new Date(b.ts));
};

AppState.markMessagesRead = function(bookingId) {
  const uid = this.currentUser.id;
  SPYDEE_DATA.messages
    .filter(m => m.bookingId === bookingId && m.toId === uid)
    .forEach(m => m.read = true);
  this.save();
};

AppState.getUnreadMessageCount = function() {
  const uid = this.currentUser.id;
  return SPYDEE_DATA.messages.filter(m => m.toId === uid && !m.read).length;
};

// Get all booking conversations for current user
AppState.getMyConversations = function() {
  const uid = this.currentUser.id;
  const myBookingIds = SPYDEE_DATA.bookings
    .filter(b => b.customerId === uid || b.vendorId === uid)
    .map(b => b.id);
  // Group messages by bookingId
  const threads = {};
  SPYDEE_DATA.messages
    .filter(m => myBookingIds.includes(m.bookingId))
    .forEach(m => {
      if (!threads[m.bookingId]) threads[m.bookingId] = { bookingId: m.bookingId, messages: [], unread: 0 };
      threads[m.bookingId].messages.push(m);
      if (m.toId === uid && !m.read) threads[m.bookingId].unread++;
    });
  return Object.values(threads).sort((a,b) => {
    const la = a.messages[a.messages.length-1]?.ts || '';
    const lb = b.messages[b.messages.length-1]?.ts || '';
    return new Date(lb) - new Date(la);
  });
};

// ── ENQUIRY SYSTEM (pre-booking, anonymised) ─────────────────
// Customer sends question to vendor; vendor name/contact NOT revealed in enquiry
// Only booking reveals contact — closes the direct-deal loophole
AppState.sendEnquiry = function(hoardingId, text) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
  if (!h) return { ok:false };
  // Check if already has open enquiry for this hoarding
  const existing = SPYDEE_DATA.enquiries.find(e =>
    e.hoardingId === hoardingId && e.customerId === this.currentUser.id && e.status === 'open'
  );
  if (existing) return { ok:false, msg:'You already have an open enquiry for this hoarding.' };
  const enq = {
    id: generateId('ENQ'),
    hoardingId, customerId: this.currentUser.id, vendorId: h.vendorId,
    text: text.trim(), reply: null,
    ts: new Date().toISOString(), repliedAt: null, status: 'open'
  };
  SPYDEE_DATA.enquiries.push(enq);
  const cust = this.currentUser;
  // Notify vendor — but show only first name and company, not mobile/email
  this.addNotification(h.vendorId, '❓ New Enquiry on Your Board',
    `${cust.name}${cust.company?' ('+cust.company+')':''} asked about "${h.title}": "${text.slice(0,80)}…"`, 'info');
  this.save();
  return { ok:true, enquiry: enq };
};

AppState.replyEnquiry = function(enquiryId, replyText) {
  const enq = SPYDEE_DATA.enquiries.find(e => e.id === enquiryId);
  if (!enq) return { ok:false };
  if (enq.vendorId !== this.currentUser.id) return { ok:false, msg:'Not your enquiry.' };
  enq.reply = replyText.trim();
  enq.repliedAt = new Date().toISOString();
  enq.status = 'replied';
  const h = SPYDEE_DATA.hoardings.find(x => x.id === enq.hoardingId);
  this.addNotification(enq.customerId, '💬 Reply to Your Enquiry',
    `Media owner replied about "${h?.title}": "${replyText.slice(0,80)}…"`, 'success');
  this.save();
  return { ok:true };
};

AppState.getMyEnquiries = function() {
  const uid = this.currentUser.id;
  const role = this.currentUser.role;
  if (role === 'customer') return SPYDEE_DATA.enquiries.filter(e => e.customerId === uid);
  if (role === 'vendor') return SPYDEE_DATA.enquiries.filter(e => e.vendorId === uid);
  return SPYDEE_DATA.enquiries;
};

// ── WAITLIST for booked hoardings ─────────────────────────────
AppState.addToWaitlist = function(hoardingId, month) {
  const uid = this.currentUser.id;
  const exists = SPYDEE_DATA.waitlists.find(w => w.hoardingId===hoardingId && w.customerId===uid && w.month===month);
  if (exists) return { ok:false, msg:'Already on waitlist for this month.' };
  SPYDEE_DATA.waitlists.push({ hoardingId, customerId: uid, month, ts: new Date().toISOString() });
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
  this.addNotification(uid, '🔔 Waitlist Joined',
    `You'll be notified when "${h?.title}" becomes available for ${month}.`, 'info');
  this.save();
  return { ok:true };
};

AppState.notifyWaitlist = function(hoardingId, month) {
  const waiters = SPYDEE_DATA.waitlists.filter(w => w.hoardingId===hoardingId && w.month===month);
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
  waiters.forEach(w => {
    this.addNotification(w.customerId, '🎉 Board Now Available!',
      `"${h?.title}" is now available for ${month}. Book before someone else does!`, 'success');
  });
  // Remove notified entries
  SPYDEE_DATA.waitlists = SPYDEE_DATA.waitlists.filter(
    w => !(w.hoardingId===hoardingId && w.month===month)
  );
  this.save();
};

// ── PAYOUT REQUESTS ───────────────────────────────────────────
AppState.requestPayout = function(amount) {
  const uid = this.currentUser.id;
  const user = SPYDEE_DATA.users.find(u => u.id === uid);
  if (!user || user.wallet < amount) return { ok:false, msg:'Insufficient wallet balance.' };
  if (amount < 500) return { ok:false, msg:'Minimum payout is ₹500.' };
  const req = {
    id: generateId('PAY'), vendorId: uid, amount: Number(amount),
    status: 'pending', ts: new Date().toISOString(), processedAt: null
  };
  SPYDEE_DATA.payoutRequests.push(req);
  this.addNotification('SA001', '💸 Payout Request',
    `${user.name} requested payout of ${formatCurrency(amount)}.`, 'info');
  this.addNotification(uid, '💸 Payout Requested',
    `Your payout of ${formatCurrency(amount)} is under review.`, 'info');
  this.save();
  return { ok:true, request: req };
};

AppState.adminProcessPayout = function(reqId, approve) {
  const req = SPYDEE_DATA.payoutRequests.find(r => r.id === reqId);
  if (!req) return { ok:false };
  req.status = approve ? 'paid' : 'rejected';
  req.processedAt = new Date().toISOString();
  if (approve) {
    const vendor = SPYDEE_DATA.users.find(u => u.id === req.vendorId);
    if (vendor) vendor.wallet = Math.max(0, (vendor.wallet||0) - req.amount);
    this.addNotification(req.vendorId, '✅ Payout Processed',
      `${formatCurrency(req.amount)} has been transferred to your bank account.`, 'success');
  } else {
    this.addNotification(req.vendorId, '❌ Payout Rejected',
      `Your payout request of ${formatCurrency(req.amount)} was rejected. Contact support.`, 'error');
  }
  this.save();
  return { ok:true };
};

// ── VIEW TRACKER ──────────────────────────────────────────────
AppState.trackView = function(hoardingId) {
  const h = SPYDEE_DATA.hoardings.find(x => x.id === hoardingId);
  if (h) { h.viewCount = (h.viewCount||0) + 1; this.save(); }
};

// ── COMPARE LIST ──────────────────────────────────────────────
AppState.compareList = [];
AppState.toggleCompare = function(hId) {
  const idx = this.compareList.indexOf(hId);
  if (idx > -1) { this.compareList.splice(idx, 1); return false; }
  if (this.compareList.length >= 3) { showToast('Compare up to 3 hoardings only.','error'); return false; }
  this.compareList.push(hId);
  return true;
};
