// ============================================================
// SPYDEE - Core Mock Data Store
// ============================================================

const SPYDEE_DATA = {

  // ── Hoarding Inventory ──────────────────────────────────────
  hoardings: [
    {
      id: "H001", vendorId: "V001",
      title: "Wakad Junction Mega Backlit",
      location: "Wakad Chowk, Near D-Mart, Pune - 411057",
      lat: 18.5986, lng: 73.7611,
      type: "Backlit", orientation: "LHS",
      width: 40, height: 20, unit: "ft",
      basePriceMonthly: 85000,
      material: "Star Flex 440 GSM",
      printSpec: "6x4 Solvent Print, 1440 DPI",
      illumination: "LED Backlit 6500K",
      traffic: "High", dailyImpression: 42000,
      images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600"],
      availability: { "2025-07": true, "2025-08": true, "2025-09": false, "2025-10": true },
      status: "available", holdBy: null, holdExpiry: null,
      verified: true,
      gmapsLink: "https://maps.google.com/?q=18.5986,73.7611",
      redSquare: { x: 120, y: 80, w: 360, h: 180 }
    },
    {
      id: "H002", vendorId: "V001",
      title: "Hinjawadi IT Park Gate Digital",
      location: "Hinjawadi Phase 1 Gate, Rajiv Gandhi Infotech Park, Pune - 411057",
      lat: 18.5912, lng: 73.7380,
      type: "Digital LED", orientation: "RHS",
      width: 20, height: 10, unit: "ft",
      basePriceMonthly: 145000,
      material: "P10 LED Panel",
      printSpec: "1920x960 LED, Full HD",
      illumination: "Self-Illuminated",
      traffic: "Very High", dailyImpression: 68000,
      images: ["https://images.unsplash.com/photo-1546552356-3f47e4e0e1da?w=600"],
      availability: { "2025-07": false, "2025-08": true, "2025-09": true, "2025-10": true },
      status: "available", holdBy: null, holdExpiry: null,
      verified: true,
      gmapsLink: "https://maps.google.com/?q=18.5912,73.7380",
      redSquare: { x: 200, y: 60, w: 240, h: 140 }
    },
    {
      id: "H003", vendorId: "V002",
      title: "Moshi Highway Unipole",
      location: "Moshi Phata, Old Pune-Mumbai Highway, PCMC - 412105",
      lat: 18.6728, lng: 73.8468,
      type: "Flex", orientation: "LHS",
      width: 50, height: 25, unit: "ft",
      basePriceMonthly: 60000,
      material: "Frontlit Flex 510 GSM",
      printSpec: "Large Format Solvent, 720 DPI",
      illumination: "External Spotlights",
      traffic: "High", dailyImpression: 38000,
      images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"],
      availability: { "2025-07": true, "2025-08": true, "2025-09": true, "2025-10": false },
      status: "available", holdBy: null, holdExpiry: null,
      verified: true,
      gmapsLink: "https://maps.google.com/?q=18.6728,73.8468",
      redSquare: { x: 80, y: 100, w: 440, h: 200 }
    },
    {
      id: "H004", vendorId: "V002",
      title: "Senapati Bapat Road Premium",
      location: "SB Road Near Westend Mall, Pune - 411016",
      lat: 18.5272, lng: 73.8371,
      type: "Backlit", orientation: "RHS",
      width: 30, height: 15, unit: "ft",
      basePriceMonthly: 120000,
      material: "Star Flex 440 GSM",
      printSpec: "6x4 Solvent Print, 1440 DPI",
      illumination: "LED Backlit 5500K",
      traffic: "Very High", dailyImpression: 75000,
      images: ["https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600"],
      availability: { "2025-07": false, "2025-08": false, "2025-09": true, "2025-10": true },
      status: "available", holdBy: null, holdExpiry: null,
      verified: true,
      gmapsLink: "https://maps.google.com/?q=18.5272,73.8371",
      redSquare: { x: 150, y: 70, w: 300, h: 160 }
    },
    {
      id: "H005", vendorId: "V003",
      title: "Chandani Chowk Flyover Gantry",
      location: "Chandani Chowk Flyover, Kothrud, Pune - 411038",
      lat: 18.5089, lng: 73.8038,
      type: "Backlit", orientation: "LHS",
      width: 60, height: 10, unit: "ft",
      basePriceMonthly: 95000,
      material: "Star Flex 440 GSM",
      printSpec: "Gantry Special 1440 DPI",
      illumination: "LED Strip Backlit",
      traffic: "Very High", dailyImpression: 82000,
      images: ["https://images.unsplash.com/photo-1580982172477-9373ff9f8073?w=600"],
      availability: { "2025-07": true, "2025-08": true, "2025-09": false, "2025-10": false },
      status: "available", holdBy: null, holdExpiry: null,
      verified: false,
      gmapsLink: "https://maps.google.com/?q=18.5089,73.8038",
      redSquare: { x: 60, y: 120, w: 480, h: 120 }
    },
    {
      id: "H006", vendorId: "V003",
      title: "Pimpri Camp Corner Backlit",
      location: "Pimpri Camp Chowk, PCMC - 411017",
      lat: 18.6186, lng: 73.8009,
      type: "Backlit", orientation: "RHS",
      width: 25, height: 12, unit: "ft",
      basePriceMonthly: 55000,
      material: "Star Flex 440 GSM",
      printSpec: "6x4 Solvent Print, 1440 DPI",
      illumination: "LED Backlit 6000K",
      traffic: "Medium", dailyImpression: 28000,
      images: ["https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=600"],
      availability: { "2025-07": true, "2025-08": false, "2025-09": true, "2025-10": true },
      status: "available", holdBy: null, holdExpiry: null,
      verified: true,
      gmapsLink: "https://maps.google.com/?q=18.6186,73.8009",
      redSquare: { x: 140, y: 90, w: 320, h: 160 }
    },
    {
      id: "H007", vendorId: "V001",
      title: "Baner Pashan Road Digital",
      location: "Baner-Pashan Link Road, Near Sus Road, Pune - 411045",
      lat: 18.5590, lng: 73.7895,
      type: "Digital LED", orientation: "LHS",
      width: 15, height: 8, unit: "ft",
      basePriceMonthly: 110000,
      material: "P8 LED Panel",
      printSpec: "1280x640 LED, Full HD",
      illumination: "Self-Illuminated",
      traffic: "High", dailyImpression: 52000,
      images: ["https://images.unsplash.com/photo-1546552356-3f47e4e0e1da?w=600"],
      availability: { "2025-07": true, "2025-08": true, "2025-09": true, "2025-10": false },
      status: "available", holdBy: null, holdExpiry: null,
      verified: true,
      gmapsLink: "https://maps.google.com/?q=18.5590,73.7895",
      redSquare: { x: 180, y: 75, w: 280, h: 150 }
    },
    {
      id: "H008", vendorId: "V002",
      title: "Nigdi Akurdi Bypass Unipole",
      location: "Nigdi-Akurdi Bypass, PCMC - 411044",
      lat: 18.6509, lng: 73.7716,
      type: "Flex", orientation: "RHS",
      width: 45, height: 22, unit: "ft",
      basePriceMonthly: 48000,
      material: "Frontlit Flex 510 GSM",
      printSpec: "Large Format Solvent, 720 DPI",
      illumination: "External Halogen",
      traffic: "Medium", dailyImpression: 24000,
      images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"],
      availability: { "2025-07": false, "2025-08": true, "2025-09": true, "2025-10": true },
      status: "available", holdBy: null, holdExpiry: null,
      verified: true,
      gmapsLink: "https://maps.google.com/?q=18.6509,73.7716",
      redSquare: { x: 90, y: 95, w: 420, h: 190 }
    },
    {
      id: "H009", vendorId: "V003",
      title: "Kothrud Depot Mega Backlit",
      location: "Kothrud Bus Depot Junction, Pune - 411038",
      lat: 18.5062, lng: 73.8189,
      type: "Backlit", orientation: "LHS",
      width: 35, height: 18, unit: "ft",
      basePriceMonthly: 78000,
      material: "Star Flex 440 GSM",
      printSpec: "6x4 Solvent Print, 1440 DPI",
      illumination: "LED Backlit 6500K",
      traffic: "High", dailyImpression: 41000,
      images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600"],
      availability: { "2025-07": true, "2025-08": false, "2025-09": false, "2025-10": true },
      status: "available", holdBy: null, holdExpiry: null,
      verified: true,
      gmapsLink: "https://maps.google.com/?q=18.5062,73.8189",
      redSquare: { x: 110, y: 85, w: 380, h: 170 }
    },
    {
      id: "H010", vendorId: "V001",
      title: "Aundh Pune University Road",
      location: "Aundh Road Near Pune University, Pune - 411007",
      lat: 18.5591, lng: 73.8086,
      type: "Backlit", orientation: "RHS",
      width: 30, height: 15, unit: "ft",
      basePriceMonthly: 90000,
      material: "Star Flex 440 GSM",
      printSpec: "6x4 Solvent Print, 1440 DPI",
      illumination: "LED Backlit 5500K",
      traffic: "High", dailyImpression: 47000,
      images: ["https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600"],
      availability: { "2025-07": true, "2025-08": true, "2025-09": false, "2025-10": true },
      status: "available", holdBy: null, holdExpiry: null,
      verified: true,
      gmapsLink: "https://maps.google.com/?q=18.5591,73.8086",
      redSquare: { x: 160, y: 75, w: 300, h: 155 }
    },
    {
      id: "H011", vendorId: "V002",
      title: "Chinchwad Station Road Digital",
      location: "Chinchwad Station Road, PCMC - 411033",
      lat: 18.6453, lng: 73.7966,
      type: "Digital LED", orientation: "LHS",
      width: 20, height: 10, unit: "ft",
      basePriceMonthly: 130000,
      material: "P10 LED Panel",
      printSpec: "1920x960 LED, Full HD",
      illumination: "Self-Illuminated",
      traffic: "Very High", dailyImpression: 62000,
      images: ["https://images.unsplash.com/photo-1546552356-3f47e4e0e1da?w=600"],
      availability: { "2025-07": true, "2025-08": true, "2025-09": true, "2025-10": false },
      status: "available", holdBy: null, holdExpiry: null,
      verified: true,
      gmapsLink: "https://maps.google.com/?q=18.6453,73.7966",
      redSquare: { x: 195, y: 65, w: 250, h: 140 }
    },
    {
      id: "H012", vendorId: "V003",
      title: "Viman Nagar Airport Road",
      location: "Viman Nagar Chowk, Near Pune Airport, Pune - 411014",
      lat: 18.5641, lng: 73.9141,
      type: "Backlit", orientation: "RHS",
      width: 40, height: 20, unit: "ft",
      basePriceMonthly: 110000,
      material: "Star Flex 440 GSM",
      printSpec: "6x4 Solvent Print, 1440 DPI",
      illumination: "LED Backlit 6000K",
      traffic: "Very High", dailyImpression: 70000,
      images: ["https://images.unsplash.com/photo-1580982172477-9373ff9f8073?w=600"],
      availability: { "2025-07": false, "2025-08": true, "2025-09": true, "2025-10": true },
      status: "available", holdBy: null, holdExpiry: null,
      verified: true,
      gmapsLink: "https://maps.google.com/?q=18.5641,73.9141",
      redSquare: { x: 120, y: 80, w: 360, h: 180 }
    },
    {
      id: "H013", vendorId: "V001",
      title: "Hadapsar Magarpatta Ring Road",
      location: "Magarpatta Ring Road, Hadapsar, Pune - 411028",
      lat: 18.5072, lng: 73.9330,
      type: "Flex", orientation: "LHS",
      width: 50, height: 25, unit: "ft",
      basePriceMonthly: 70000,
      material: "Star Flex 440 GSM",
      printSpec: "6x4 Solvent Print, 1440 DPI",
      illumination: "External LED Spots",
      traffic: "High", dailyImpression: 45000,
      images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"],
      availability: { "2025-07": true, "2025-08": false, "2025-09": true, "2025-10": true },
      status: "available", holdBy: null, holdExpiry: null,
      verified: false,
      gmapsLink: "https://maps.google.com/?q=18.5072,73.9330",
      redSquare: { x: 75, y: 100, w: 450, h: 200 }
    },
    {
      id: "H014", vendorId: "V002",
      title: "Katraj Bypass Highway",
      location: "Katraj Bypass Road, Pune - 411046",
      lat: 18.4514, lng: 73.8609,
      type: "Backlit", orientation: "RHS",
      width: 35, height: 18, unit: "ft",
      basePriceMonthly: 65000,
      material: "Star Flex 440 GSM",
      printSpec: "6x4 Solvent Print, 1440 DPI",
      illumination: "LED Backlit 6000K",
      traffic: "High", dailyImpression: 40000,
      images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600"],
      availability: { "2025-07": true, "2025-08": true, "2025-09": true, "2025-10": false },
      status: "available", holdBy: null, holdExpiry: null,
      verified: true,
      gmapsLink: "https://maps.google.com/?q=18.4514,73.8609",
      redSquare: { x: 110, y: 88, w: 380, h: 172 }
    },
    {
      id: "H015", vendorId: "V003",
      title: "Sangvi Kasarwadi Overbridge",
      location: "Kasarwadi Overbridge, Sangvi, PCMC - 411034",
      lat: 18.5817, lng: 73.8091,
      type: "Backlit", orientation: "LHS",
      width: 30, height: 15, unit: "ft",
      basePriceMonthly: 58000,
      material: "Star Flex 440 GSM",
      printSpec: "6x4 Solvent Print, 1440 DPI",
      illumination: "LED Backlit 5500K",
      traffic: "Medium", dailyImpression: 30000,
      images: ["https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=600"],
      availability: { "2025-07": true, "2025-08": true, "2025-09": false, "2025-10": true },
      status: "available", holdBy: null, holdExpiry: null,
      verified: true,
      gmapsLink: "https://maps.google.com/?q=18.5817,73.8091",
      redSquare: { x: 145, y: 80, w: 310, h: 160 }
    }
  ],

  // ── Users (hashed pass = md5-like mock) ─────────────────────
  users: [
    {
      id: "SA001", role: "superadmin",
      name: "Spydee Admin", email: "admin@spydee.in",
      mobile: "9000000000", password: "Admin@123",
      verified: true, createdAt: "2024-01-01"
    },
    {
      id: "V001", role: "vendor",
      name: "Rajan Hoarding Co.", email: "rajan@hoardings.in",
      mobile: "9823001234", password: "Vendor@123",
      company: "Rajan Outdoor Pvt Ltd",
      gst: "27AABCR1234F1ZP",
      verified: true, otpVerified: true,
      wallet: 150000, createdAt: "2024-02-15",
      inventoryIds: ["H001", "H002", "H007", "H010", "H013"]
    },
    {
      id: "V002", role: "vendor",
      name: "Mehta Media Works", email: "mehta@mediaworks.in",
      mobile: "9823005678", password: "Vendor@123",
      company: "Mehta Advertising Solutions",
      gst: "27AABCM5678G1ZQ",
      verified: true, otpVerified: true,
      wallet: 90000, createdAt: "2024-03-10",
      inventoryIds: ["H003", "H004", "H008", "H011", "H014"]
    },
    {
      id: "V003", role: "vendor",
      name: "Suresh Outdoor Ads", email: "suresh@outdoorads.in",
      mobile: "9823009012", password: "Vendor@123",
      company: "Suresh Signages Ltd",
      gst: "27AABCS9012H1ZR",
      verified: true, otpVerified: true,
      wallet: 120000, createdAt: "2024-04-05",
      inventoryIds: ["H005", "H006", "H009", "H012", "H015"]
    },
    {
      id: "C001", role: "customer",
      name: "Nikhil Joshi", email: "nikhil@techstartup.in",
      mobile: "9765432100", password: "Cust@123",
      company: "TechStartup Pune",
      gst: "27AABCN0001I1ZS",
      verified: true, otpVerified: true,
      wallet: 500000, createdAt: "2024-05-01",
      bookings: [], holds: []
    },
    {
      id: "P001", role: "printer",
      name: "PrintMaster Pune", email: "print@printmaster.in",
      mobile: "9812345678", password: "Print@123",
      company: "PrintMaster Digital Solutions",
      gst: "27AABCP0001J1ZT",
      verified: true, otpVerified: true,
      wallet: 75000, createdAt: "2024-05-15",
      acceptedJobs: [], completedJobs: []
    }
  ],

  // ── Bookings ─────────────────────────────────────────────────
  bookings: [
    {
      id: "BK001", customerId: "C001", hoardingId: "H001",
      status: "confirmed", month: "2025-07",
      basePriceMonthly: 85000, gst: 15300, depositPaid: 8500,
      totalDue: 91800, printJob: null,
      createdAt: "2025-06-15", proofOfPerf: null
    }
  ],

  // ── Print Jobs ────────────────────────────────────────────────
  printJobs: [
    {
      id: "PJ001", bookingId: "BK001", hoardingId: "H001",
      customerId: "C001", printerId: null,
      status: "open",
      dimensions: "40ft x 20ft",
      material: "Star Flex 440 GSM",
      artworkUrl: null,
      sla: "3 days",
      createdAt: "2025-06-16"
    }
  ],

  // ── Notifications ─────────────────────────────────────────────
  notifications: []
};

// ── Utility helpers ───────────────────────────────────────────
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function generateId(prefix) {
  return prefix + Date.now().toString(36).toUpperCase();
}

function formatCurrency(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function calcTax(base) {
  const gst = base * 0.18;
  const deposit = base * 0.10;
  const totalDue = (base + gst) - deposit;
  return { base, gst, deposit, totalDue };
}

// OTP simulation
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
