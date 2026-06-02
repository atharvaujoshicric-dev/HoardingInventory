// ============================================================
// SPYDEE v3 — App State Machine & Auth Engine
// ============================================================

const AppState = {
  currentUser: null,
  currentView: 'landing',
  dashboardTab: null,
  selectedHoarding: null,
  mapPin: { lat: 18.5642, lng: 73.8482 },
  radiusKm: 3,
  filters: { type:'all', minPrice:0, maxPrice:999999, vendor:'all', status:'all', traffic:'all' },
  nightMode: false,
  holdTimers: {},
  pendingOTP: {},
  uploadedCreative: null,
  adminTab: 'overview',
  notifications: [],
  _currentRedSquare: null,
  _radiusTimer: null,
  _searchQuery: '',

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
        holdTimers: Object.fromEntries(Object.entries(this.holdTimers).map(([k,v])=>[k,{expiry:v.expiry}]))
      }));
    } catch(e){ console.warn('Save error',e); }
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
        Object.entries(d.holdTimers).forEach(([hId,{expiry}]) => {
          if (Date.now() < expiry) this.startHoldCountdown(hId,expiry);
          else { const h=SPYDEE_DATA.hoardings.find(x=>x.id===hId); if(h&&h.status==='on-hold') this.expireHold(hId); }
        });
      }
    } catch(e){ console.warn('Load error',e); }
  },

  reset() { localStorage.removeItem('spydee_v3'); location.reload(); },

  // ── Auth ─────────────────────────────────────────────────────
  login(email, password) {
    const user = SPYDEE_DATA.users.find(u=>u.email.toLowerCase()===email.toLowerCase()&&u.password===password);
    if (!user) return { ok:false, msg:'Invalid email or password.' };
    if (user.suspended) return { ok:false, msg:'Account suspended. Contact support.' };
    if (!user.otpVerified && user.role!=='superadmin') return { ok:false, msg:'Please verify your email OTP first.', needVerify:true };
    user.loginCount = (user.loginCount||0)+1;
    user.lastActive = new Date().toISOString();
    this.currentUser = JSON.parse(JSON.stringify(user));
    this.dashboardTab = null;
    this.save();
    return { ok:true, user:this.currentUser };
  },

  logout() {
    this.currentUser=null; this.selectedHoarding=null; this.uploadedCreative=null;
    this.currentView='landing'; this.dashboardTab=null; this.save();
  },

  register(data) {
    if (SPYDEE_DATA.users.find(u=>u.email.toLowerCase()===data.email.toLowerCase()))
      return { ok:false, msg:'Email already registered.' };
    if (SPYDEE_DATA.users.find(u=>u.mobile===data.mobile))
      return { ok:false, msg:'Mobile number already registered.' };
    const otp = generateOTP();
    const newUser = {
      id: generateId(data.role==='vendor'?'V':data.role==='printer'?'P':'C'),
      role:data.role, name:data.name, email:data.email, mobile:data.mobile, password:data.password,
      company:data.company||'', gst:data.gst||'', verified:false, otpVerified:false, suspended:false,
      wallet: data.role==='customer'?300000:data.role==='vendor'?100000:50000,
      createdAt:new Date().toISOString().split('T')[0], lastActive:new Date().toISOString(), loginCount:0,
      ...(data.role==='vendor'?{inventoryIds:[],rating:0,reviewCount:0,totalEarnings:0}:{}),
      ...(data.role==='customer'?{bookings:[],holds:[],totalSpend:0}:{}),
      ...(data.role==='printer'?{acceptedJobs:[],completedJobs:[],totalEarnings:0,rating:0,reviewCount:0}:{})
    };
    SPYDEE_DATA.users.push(newUser);
    this.pendingOTP[data.email.toLowerCase()] = otp;
    this.save();
    return { ok:true, userId:newUser.id, otp };
  },

  verifyOTP(email, otp) {
    const key = email.toLowerCase();
    if (this.pendingOTP[key]===otp) {
      const user=SPYDEE_DATA.users.find(u=>u.email.toLowerCase()===key);
      if(user){ user.otpVerified=true; user.verified=true; delete this.pendingOTP[key]; this.save(); return {ok:true}; }
    }
    return { ok:false, msg:'Invalid OTP. Try again.' };
  },

  resendOTP(email) {
    const otp=generateOTP();
    this.pendingOTP[email.toLowerCase()]=otp;
    return otp;
  },

  // ── Hold Engine ──────────────────────────────────────────────
  reserveHoarding(hoardingId) {
    const h=SPYDEE_DATA.hoardings.find(x=>x.id===hoardingId);
    if(!h||h.status!=='available') return {ok:false,msg:'Not available.'};
    const user=SPYDEE_DATA.users.find(u=>u.id===this.currentUser.id);
    const deposit=Math.round(h.basePriceMonthly*0.10);
    if(user.wallet<deposit) return {ok:false,msg:`Insufficient wallet. Need ${formatCurrency(deposit)}.`};
    user.wallet-=deposit; h.status='on-hold'; h.holdBy=user.id; h.holdDeposit=deposit;
    const expiry=Date.now()+12*60*60*1000;
    h.holdExpiry=expiry; this.currentUser.wallet=user.wallet;
    this.startHoldCountdown(hoardingId,expiry);
    this.addNotification(user.id,'🔒 Hold Placed',`${h.title} is reserved for 12 hours.`,'info');
    this.save();
    return {ok:true,deposit,expiry};
  },

  cancelHold(hoardingId) {
    const h=SPYDEE_DATA.hoardings.find(x=>x.id===hoardingId);
    if(!h||h.status!=='on-hold') return {ok:false,msg:'No active hold.'};
    const user=SPYDEE_DATA.users.find(u=>u.id===h.holdBy);
    const refund = h.holdDeposit || 0; // capture BEFORE clearing
    if(user) user.wallet+=refund;
    h.status='available'; h.holdBy=null; h.holdExpiry=null; h.holdDeposit=0;
    if(this.currentUser?.id===user?.id) this.currentUser.wallet=user.wallet;
    clearInterval(this.holdTimers[hoardingId]?.interval);
    delete this.holdTimers[hoardingId];
    this.save();
    return {ok:true, refund};
  },

  startHoldCountdown(hoardingId,expiry) {
    if(this.holdTimers[hoardingId]) clearInterval(this.holdTimers[hoardingId].interval);
    const interval=setInterval(()=>{
      if(Date.now()>=expiry){ this.expireHold(hoardingId); renderApp(); }
      else updateCountdownDisplay(hoardingId);
    },1000);
    this.holdTimers[hoardingId]={interval,expiry};
  },

  expireHold(hoardingId) {
    const h=SPYDEE_DATA.hoardings.find(x=>x.id===hoardingId);
    if(!h) return;
    const deposit=h.holdDeposit||0;
    const vendor=SPYDEE_DATA.users.find(u=>u.id===h.vendorId);
    if(vendor) vendor.totalEarnings=(vendor.totalEarnings||0)+Math.round(deposit*0.4);
    SPYDEE_DATA.platformRevenue=(SPYDEE_DATA.platformRevenue||0)+Math.round(deposit*0.6);
    h.status='available'; h.holdBy=null; h.holdExpiry=null; h.holdDeposit=0;
    clearInterval(this.holdTimers[hoardingId]?.interval);
    delete this.holdTimers[hoardingId];
    this.save();
    showToast(`⏰ Hold on ${h.title} expired. Deposit forfeited.`,'error');
  },

  confirmBooking(hoardingId, month, durationMonths=1) {
    const h=SPYDEE_DATA.hoardings.find(x=>x.id===hoardingId);
    if(!h||h.status!=='on-hold') return {ok:false,msg:'No active hold found.'};
    const user=SPYDEE_DATA.users.find(u=>u.id===this.currentUser.id);
    if(!user) return {ok:false,msg:'User not found.'};
    const {base,gst,deposit,totalDue}=calcTax(h.basePriceMonthly*durationMonths);
    if(user.wallet<totalDue) return {ok:false,msg:`Need ${formatCurrency(totalDue)} more.`};
    user.wallet-=totalDue; user.totalSpend=(user.totalSpend||0)+totalDue;
    this.currentUser.wallet=user.wallet;
    h.status='booked';
    clearInterval(this.holdTimers[hoardingId]?.interval);
    delete this.holdTimers[hoardingId];
    const booking={
      id:generateId('BK'),customerId:user.id,hoardingId,vendorId:h.vendorId,
      status:'confirmed',month,durationMonths,basePriceMonthly:h.basePriceMonthly,
      gst,depositPaid:deposit,totalDue,printJob:null,
      createdAt:new Date().toISOString().split('T')[0],proofOfPerf:null,rating:null,review:null
    };
    SPYDEE_DATA.bookings.push(booking);
    if(user.bookings) user.bookings.push(booking.id);
    const vendor=SPYDEE_DATA.users.find(u=>u.id===h.vendorId);
    if(vendor) vendor.totalEarnings=(vendor.totalEarnings||0)+Math.round(totalDue*0.85);
    SPYDEE_DATA.platformRevenue=(SPYDEE_DATA.platformRevenue||0)+Math.round(totalDue*0.15);
    this.addNotification(user.id,'🎉 Booking Confirmed',`${h.title} booked for ${month}.`,'success');
    this.save();
    return {ok:true,booking,invoice:{base,gst,deposit,totalDue}};
  },

  cancelBooking(bookingId) {
    const b=SPYDEE_DATA.bookings.find(x=>x.id===bookingId);
    if(!b||b.status!=='confirmed') return {ok:false,msg:'Cannot cancel this booking.'};
    const refund=Math.round(b.totalDue*0.5);
    const user=SPYDEE_DATA.users.find(u=>u.id===b.customerId);
    if(user) user.wallet+=refund;
    b.status='cancelled';
    const h=SPYDEE_DATA.hoardings.find(x=>x.id===b.hoardingId);
    if(h) h.status='available';
    if(this.currentUser?.id===user?.id) this.currentUser.wallet=user.wallet;
    this.save();
    return {ok:true,refund};
  },

  rateBooking(bookingId, rating, review) {
    const b=SPYDEE_DATA.bookings.find(x=>x.id===bookingId);
    if(b){ b.rating=rating; b.review=review; b.ratingDate=new Date().toISOString().split('T')[0]; }
    const h=SPYDEE_DATA.hoardings.find(x=>x.id===b?.hoardingId);
    if(h) { h.rating=((h.rating||0)*h.reviewCount+rating)/(h.reviewCount+1); h.reviewCount=(h.reviewCount||0)+1; }
    this.save();
  },

  // ── Vendor Inventory CRUD ────────────────────────────────────
  addInventory(data) {
    const vendor=SPYDEE_DATA.users.find(u=>u.id===this.currentUser.id);
    if(!vendor||vendor.role!=='vendor') return {ok:false};
    const newH={
      id:generateId('H'),vendorId:vendor.id,
      title:data.title,location:data.location,
      lat:parseFloat(data.lat)||18.5642,lng:parseFloat(data.lng)||73.8482,
      type:data.type,orientation:data.orientation,
      width:Number(data.width),height:Number(data.height),unit:'ft',
      basePriceMonthly:Number(data.basePriceMonthly),
      material:data.material,printSpec:data.printSpec,illumination:data.illumination,
      traffic:data.traffic||'Medium',dailyImpression:Number(data.dailyImpression)||10000,
      images:[],availability:{},status:'available',holdBy:null,holdExpiry:null,holdDeposit:0,
      verified:false,gmapsLink:data.gmapsLink||'',
      redSquare:data.redSquare||{x:100,y:80,w:400,h:180},
      rating:0,reviewCount:0
    };
    SPYDEE_DATA.hoardings.push(newH);
    if(!vendor.inventoryIds) vendor.inventoryIds=[];
    vendor.inventoryIds.push(newH.id);
    if(this.currentUser.inventoryIds) this.currentUser.inventoryIds.push(newH.id);
    this.save();
    return {ok:true,hoarding:newH};
  },

  updateInventory(id, data) {
    const h=SPYDEE_DATA.hoardings.find(x=>x.id===id);
    if(!h) return {ok:false};
    // Admin can edit any; vendor can only edit their own
    if(this.currentUser.role!=='superadmin' && h.vendorId!==this.currentUser.id) return {ok:false};
    Object.assign(h,data);
    this.save();
    return {ok:true,refund:h.holdDeposit||0};
  },

  deleteInventory(id) {
    const h=SPYDEE_DATA.hoardings.find(x=>x.id===id);
    if(!h) return {ok:false};
    if(this.currentUser.role!=='superadmin' && h.vendorId!==this.currentUser.id) return {ok:false};
    SPYDEE_DATA.hoardings=SPYDEE_DATA.hoardings.filter(x=>x.id!==id);
    const vendor=SPYDEE_DATA.users.find(u=>u.id===h.vendorId);
    if(vendor) vendor.inventoryIds=vendor.inventoryIds.filter(i=>i!==id);
    this.save();
    return {ok:true,refund:h.holdDeposit||0};
  },

  uploadHoardingImage(hoardingId,dataUrl) {
    const h=SPYDEE_DATA.hoardings.find(x=>x.id===hoardingId);
    if(!h) return {ok:false};
    if(!h.images) h.images=[];
    h.images.push(dataUrl);
    this.save();
    return {ok:true,index:h.images.length-1};
  },

  deleteHoardingImage(hoardingId,index) {
    const h=SPYDEE_DATA.hoardings.find(x=>x.id===hoardingId);
    if(!h||!h.images) return {ok:false};
    h.images.splice(index,1);
    this.save();
    return {ok:true,refund:h.holdDeposit||0};
  },

  // ── Print Jobs ────────────────────────────────────────────────
  createPrintJob(bookingId) {
    const booking=SPYDEE_DATA.bookings.find(b=>b.id===bookingId);
    if(!booking) return {ok:false};
    if(booking.printJob) return {ok:false,msg:'Print job already exists.'};
    const h=SPYDEE_DATA.hoardings.find(x=>x.id===booking.hoardingId);
    const pj={
      id:generateId('PJ'),bookingId,hoardingId:booking.hoardingId,
      customerId:booking.customerId,vendorId:booking.vendorId,printerId:null,
      status:'open',dimensions:`${h.width}ft x ${h.height}ft`,
      material:h.material,printSpec:h.printSpec,artworkUrl:null,
      sla:'3 days',priority:'normal',
      priceQuote:Math.round(h.width*h.height*12),
      createdAt:new Date().toISOString().split('T')[0],
      acceptedAt:null,dispatchedAt:null,trackingNote:''
    };
    SPYDEE_DATA.printJobs.push(pj);
    booking.printJob=pj.id;
    this.addNotification(booking.customerId,'🖨 Print Job Created',`Job ${pj.id} posted to printers.`,'info');
    this.save();
    return {ok:true,printJob:pj};
  },

  acceptPrintJob(jobId) {
    const pj=SPYDEE_DATA.printJobs.find(j=>j.id===jobId);
    if(!pj||pj.status!=='open') return {ok:false};
    pj.printerId=this.currentUser.id; pj.status='in-progress';
    pj.acceptedAt=new Date().toISOString().split('T')[0];
    const printer=SPYDEE_DATA.users.find(u=>u.id===this.currentUser.id);
    if(printer?.acceptedJobs) printer.acceptedJobs.push(jobId);
    this.addNotification(pj.customerId,'✅ Printer Accepted',`Job ${jobId} is in progress.`,'success');
    this.save();
    return {ok:true,refund:h.holdDeposit||0};
  },

  markPrintJobDispatched(jobId,trackingNote) {
    const pj=SPYDEE_DATA.printJobs.find(j=>j.id===jobId);
    if(!pj||pj.printerId!==this.currentUser.id) return {ok:false};
    pj.status='dispatched'; pj.dispatchedAt=new Date().toISOString().split('T')[0];
    pj.trackingNote=trackingNote||'';
    const printer=SPYDEE_DATA.users.find(u=>u.id===this.currentUser.id);
    if(printer){
      printer.acceptedJobs=(printer.acceptedJobs||[]).filter(j=>j!==jobId);
      if(!printer.completedJobs) printer.completedJobs=[];
      printer.completedJobs.push(jobId);
      printer.totalEarnings=(printer.totalEarnings||0)+(pj.priceQuote||0);
    }
    this.addNotification(pj.customerId,'🚚 Dispatched',`Job ${jobId} dispatched.`,'success');
    this.save();
    return {ok:true,refund:h.holdDeposit||0};
  },

  updatePrintJobArtwork(jobId,artworkUrl) {
    const pj=SPYDEE_DATA.printJobs.find(j=>j.id===jobId);
    if(!pj) return {ok:false};
    pj.artworkUrl=artworkUrl; this.save(); return {ok:true,refund:h.holdDeposit||0};
  },

  deletePrintJobArtwork(jobId) {
    const pj=SPYDEE_DATA.printJobs.find(j=>j.id===jobId);
    if(!pj) return {ok:false};
    pj.artworkUrl=null; this.save(); return {ok:true,refund:h.holdDeposit||0};
  },

  // ── Admin Full Powers ─────────────────────────────────────────
  adminUpdateUser(userId,fields) {
    const user=SPYDEE_DATA.users.find(u=>u.id===userId);
    if(!user) return {ok:false};
    Object.assign(user,fields);
    this.save(); return {ok:true,refund:h.holdDeposit||0};
  },

  adminSuspendUser(userId) {
    const user=SPYDEE_DATA.users.find(u=>u.id===userId);
    if(!user||user.role==='superadmin') return {ok:false};
    user.suspended=!user.suspended;
    this.save(); return {ok:true,suspended:user.suspended};
  },

  adminDeleteUser(userId) {
    const idx=SPYDEE_DATA.users.findIndex(u=>u.id===userId);
    if(idx===-1) return {ok:false};
    SPYDEE_DATA.users.splice(idx,1);
    this.save(); return {ok:true,refund:h.holdDeposit||0};
  },

  adminTopUpWallet(userId,amount) {
    const user=SPYDEE_DATA.users.find(u=>u.id===userId);
    if(!user) return {ok:false};
    user.wallet=(user.wallet||0)+Number(amount);
    if(this.currentUser?.id===userId) this.currentUser.wallet=user.wallet;
    this.save(); return {ok:true,newBalance:user.wallet};
  },

  adminForceVerify(userId) {
    const user=SPYDEE_DATA.users.find(u=>u.id===userId);
    if(!user) return {ok:false};
    user.verified=true; user.otpVerified=true;
    this.save(); return {ok:true,refund:h.holdDeposit||0};
  },

  adminUpdateBooking(bookingId,fields) {
    const b=SPYDEE_DATA.bookings.find(x=>x.id===bookingId);
    if(!b) return {ok:false};
    Object.assign(b,fields); this.save(); return {ok:true,refund:h.holdDeposit||0};
  },

  adminCancelBooking(bookingId) {
    const b=SPYDEE_DATA.bookings.find(x=>x.id===bookingId);
    if(!b) return {ok:false};
    b.status='cancelled-admin';
    const h=SPYDEE_DATA.hoardings.find(x=>x.id===b.hoardingId);
    if(h) h.status='available';
    this.save(); return {ok:true,refund:h.holdDeposit||0};
  },

  adminDeleteHoarding(hId) {
    const idx=SPYDEE_DATA.hoardings.findIndex(x=>x.id===hId);
    if(idx===-1) return {ok:false};
    SPYDEE_DATA.hoardings.splice(idx,1);
    this.save(); return {ok:true,refund:h.holdDeposit||0};
  },

  adminAdjustPrice(hId,newPrice) {
    const h=SPYDEE_DATA.hoardings.find(x=>x.id===hId);
    if(!h) return {ok:false};
    h.basePriceMonthly=Number(newPrice);
    this.save(); return {ok:true,refund:h.holdDeposit||0};
  },

  adminAssignPrinter(jobId,printerId) {
    const pj=SPYDEE_DATA.printJobs.find(j=>j.id===jobId);
    if(!pj) return {ok:false};
    pj.printerId=printerId||null;
    if(printerId) pj.status='in-progress';
    const printer=SPYDEE_DATA.users.find(u=>u.id===printerId);
    if(printer?.acceptedJobs) printer.acceptedJobs.push(jobId);
    this.save(); return {ok:true,refund:h.holdDeposit||0};
  },

  toggleHoardingVerify(hId) {
    const h=SPYDEE_DATA.hoardings.find(x=>x.id===hId);
    if(h){ h.verified=!h.verified; this.save(); }
  },

  toggleHoardingFeatured(hId) {
    const h=SPYDEE_DATA.hoardings.find(x=>x.id===hId);
    if(h){ h.featured=!h.featured; this.save(); }
  },

  // ── Notifications ─────────────────────────────────────────────
  addNotification(userId,title,message,type='info') {
    this.notifications.push({
      id:generateId('N'),userId,title,message,type,
      read:false,createdAt:new Date().toISOString()
    });
  },

  markNotifRead(notifId) {
    const n=this.notifications.find(x=>x.id===notifId);
    if(n){ n.read=true; this.save(); }
  },

  markAllNotifRead() {
    this.notifications.filter(n=>n.userId===this.currentUser?.id).forEach(n=>n.read=true);
    this.save();
  },

  getMyNotifications() {
    return this.notifications
      .filter(n=>n.userId===this.currentUser?.id)
      .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
      .slice(0,20);
  },

  getUnreadCount() {
    return this.notifications.filter(n=>n.userId===this.currentUser?.id && !n.read).length;
  },

  broadcastNotification(target,title,message) {
    const users = target==='all' ? SPYDEE_DATA.users : SPYDEE_DATA.users.filter(u=>u.role===target);
    users.forEach(u=>this.addNotification(u.id,title,message,'info'));
    this.save();
  },

  // ── Filters & Analytics ───────────────────────────────────────
  getFilteredHoardings() {
    const q=this._searchQuery.toLowerCase();
    return SPYDEE_DATA.hoardings.filter(h => {
      if(haversineDistance(this.mapPin.lat,this.mapPin.lng,h.lat,h.lng)>this.radiusKm*1000) return false;
      if(this.filters.type!=='all'&&h.type!==this.filters.type) return false;
      if(h.basePriceMonthly<this.filters.minPrice||h.basePriceMonthly>this.filters.maxPrice) return false;
      if(this.filters.vendor!=='all'&&h.vendorId!==this.filters.vendor) return false;
      if(this.filters.status!=='all'&&h.status!==this.filters.status) return false;
      if(this.filters.traffic!=='all'&&h.traffic!==this.filters.traffic) return false;
      if(q&&!h.title.toLowerCase().includes(q)&&!h.location.toLowerCase().includes(q)) return false;
      return true;
    });
  },

  getRevenueData() {
    const months=['2025-02','2025-03','2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10'];
    return months.map(m=>({
      month:m,
      revenue:SPYDEE_DATA.bookings.filter(b=>b.month===m&&b.status==='confirmed').reduce((s,b)=>s+b.basePriceMonthly,0),
      bookings:SPYDEE_DATA.bookings.filter(b=>b.month===m).length
    }));
  }
};
