// ============================================================
// SPYDEE v3 — Core Mock Data Store
// ============================================================

const SPYDEE_DATA = {
  platformRevenue: 12500,

  hoardings: [
    { id:"H001",vendorId:"V001",title:"Wakad Junction Mega Backlit",location:"Wakad Chowk, Near D-Mart, Pune - 411057",lat:18.5986,lng:73.7611,type:"Backlit",orientation:"LHS",width:40,height:20,unit:"ft",basePriceMonthly:85000,material:"Star Flex 440 GSM",printSpec:"6x4 Solvent Print, 1440 DPI",illumination:"LED Backlit 6500K",traffic:"High",dailyImpression:42000,images:[],availability:{"2025-07":true,"2025-08":true,"2025-09":false,"2025-10":true},status:"available",holdBy:null,holdExpiry:null,holdDeposit:0,verified:true,gmapsLink:"https://maps.google.com/?q=18.5986,73.7611",redSquare:{x:100,y:80,w:400,h:180},rating:4.2,reviewCount:8 },
    { id:"H002",vendorId:"V001",title:"Hinjawadi IT Park Digital",location:"Hinjawadi Phase 1 Gate, Rajiv Gandhi Infotech Park, Pune - 411057",lat:18.5912,lng:73.7380,type:"Digital LED",orientation:"RHS",width:20,height:10,unit:"ft",basePriceMonthly:145000,material:"P10 LED Panel",printSpec:"1920x960 LED, Full HD",illumination:"Self-Illuminated",traffic:"Very High",dailyImpression:68000,images:[],availability:{"2025-07":false,"2025-08":true,"2025-09":true,"2025-10":true},status:"available",holdBy:null,holdExpiry:null,holdDeposit:0,verified:true,gmapsLink:"https://maps.google.com/?q=18.5912,73.7380",redSquare:{x:200,y:60,w:240,h:140},rating:4.8,reviewCount:12 },
    { id:"H003",vendorId:"V002",title:"Moshi Highway Unipole",location:"Moshi Phata, Old Pune-Mumbai Highway, PCMC - 412105",lat:18.6728,lng:73.8468,type:"Flex",orientation:"LHS",width:50,height:25,unit:"ft",basePriceMonthly:60000,material:"Frontlit Flex 510 GSM",printSpec:"Large Format Solvent, 720 DPI",illumination:"External Spotlights",traffic:"High",dailyImpression:38000,images:[],availability:{"2025-07":true,"2025-08":true,"2025-09":true,"2025-10":false},status:"available",holdBy:null,holdExpiry:null,holdDeposit:0,verified:true,gmapsLink:"https://maps.google.com/?q=18.6728,73.8468",redSquare:{x:80,y:100,w:440,h:200},rating:3.9,reviewCount:5 },
    { id:"H004",vendorId:"V002",title:"Senapati Bapat Road Premium",location:"SB Road Near Westend Mall, Pune - 411016",lat:18.5272,lng:73.8371,type:"Backlit",orientation:"RHS",width:30,height:15,unit:"ft",basePriceMonthly:120000,material:"Star Flex 440 GSM",printSpec:"6x4 Solvent Print, 1440 DPI",illumination:"LED Backlit 5500K",traffic:"Very High",dailyImpression:75000,images:[],availability:{"2025-07":false,"2025-08":false,"2025-09":true,"2025-10":true},status:"available",holdBy:null,holdExpiry:null,holdDeposit:0,verified:true,gmapsLink:"https://maps.google.com/?q=18.5272,73.8371",redSquare:{x:150,y:70,w:300,h:160},rating:4.6,reviewCount:15 },
    { id:"H005",vendorId:"V003",title:"Chandani Chowk Flyover Gantry",location:"Chandani Chowk Flyover, Kothrud, Pune - 411038",lat:18.5089,lng:73.8038,type:"Backlit",orientation:"LHS",width:60,height:10,unit:"ft",basePriceMonthly:95000,material:"Star Flex 440 GSM",printSpec:"Gantry Special 1440 DPI",illumination:"LED Strip Backlit",traffic:"Very High",dailyImpression:82000,images:[],availability:{"2025-07":true,"2025-08":true,"2025-09":false,"2025-10":false},status:"available",holdBy:null,holdExpiry:null,holdDeposit:0,verified:false,gmapsLink:"https://maps.google.com/?q=18.5089,73.8038",redSquare:{x:60,y:120,w:480,h:120},rating:0,reviewCount:0 },
    { id:"H006",vendorId:"V003",title:"Pimpri Camp Corner Backlit",location:"Pimpri Camp Chowk, PCMC - 411017",lat:18.6186,lng:73.8009,type:"Backlit",orientation:"RHS",width:25,height:12,unit:"ft",basePriceMonthly:55000,material:"Star Flex 440 GSM",printSpec:"6x4 Solvent Print, 1440 DPI",illumination:"LED Backlit 6000K",traffic:"Medium",dailyImpression:28000,images:[],availability:{"2025-07":true,"2025-08":false,"2025-09":true,"2025-10":true},status:"available",holdBy:null,holdExpiry:null,holdDeposit:0,verified:true,gmapsLink:"https://maps.google.com/?q=18.6186,73.8009",redSquare:{x:140,y:90,w:320,h:160},rating:4.1,reviewCount:7 },
    { id:"H007",vendorId:"V001",title:"Baner Pashan Digital",location:"Baner-Pashan Link Road, Near Sus Road, Pune - 411045",lat:18.5590,lng:73.7895,type:"Digital LED",orientation:"LHS",width:15,height:8,unit:"ft",basePriceMonthly:110000,material:"P8 LED Panel",printSpec:"1280x640 LED, Full HD",illumination:"Self-Illuminated",traffic:"High",dailyImpression:52000,images:[],availability:{"2025-07":true,"2025-08":true,"2025-09":true,"2025-10":false},status:"available",holdBy:null,holdExpiry:null,holdDeposit:0,verified:true,gmapsLink:"https://maps.google.com/?q=18.5590,73.7895",redSquare:{x:180,y:75,w:280,h:150},rating:4.5,reviewCount:10 },
    { id:"H008",vendorId:"V002",title:"Nigdi Akurdi Bypass Unipole",location:"Nigdi-Akurdi Bypass, PCMC - 411044",lat:18.6509,lng:73.7716,type:"Flex",orientation:"RHS",width:45,height:22,unit:"ft",basePriceMonthly:48000,material:"Frontlit Flex 510 GSM",printSpec:"Large Format Solvent, 720 DPI",illumination:"External Halogen",traffic:"Medium",dailyImpression:24000,images:[],availability:{"2025-07":false,"2025-08":true,"2025-09":true,"2025-10":true},status:"available",holdBy:null,holdExpiry:null,holdDeposit:0,verified:true,gmapsLink:"https://maps.google.com/?q=18.6509,73.7716",redSquare:{x:90,y:95,w:420,h:190},rating:3.7,reviewCount:4 },
    { id:"H009",vendorId:"V003",title:"Kothrud Depot Mega Backlit",location:"Kothrud Bus Depot Junction, Pune - 411038",lat:18.5062,lng:73.8189,type:"Backlit",orientation:"LHS",width:35,height:18,unit:"ft",basePriceMonthly:78000,material:"Star Flex 440 GSM",printSpec:"6x4 Solvent Print, 1440 DPI",illumination:"LED Backlit 6500K",traffic:"High",dailyImpression:41000,images:[],availability:{"2025-07":true,"2025-08":false,"2025-09":false,"2025-10":true},status:"available",holdBy:null,holdExpiry:null,holdDeposit:0,verified:true,gmapsLink:"https://maps.google.com/?q=18.5062,73.8189",redSquare:{x:110,y:85,w:380,h:170},rating:4.3,reviewCount:9 },
    { id:"H010",vendorId:"V001",title:"Aundh Pune University Road",location:"Aundh Road Near Pune University, Pune - 411007",lat:18.5591,lng:73.8086,type:"Backlit",orientation:"RHS",width:30,height:15,unit:"ft",basePriceMonthly:90000,material:"Star Flex 440 GSM",printSpec:"6x4 Solvent Print, 1440 DPI",illumination:"LED Backlit 5500K",traffic:"High",dailyImpression:47000,images:[],availability:{"2025-07":true,"2025-08":true,"2025-09":false,"2025-10":true},status:"available",holdBy:null,holdExpiry:null,holdDeposit:0,verified:true,gmapsLink:"https://maps.google.com/?q=18.5591,73.8086",redSquare:{x:160,y:75,w:300,h:155},rating:4.4,reviewCount:11 },
    { id:"H011",vendorId:"V002",title:"Chinchwad Station Digital",location:"Chinchwad Station Road, PCMC - 411033",lat:18.6453,lng:73.7966,type:"Digital LED",orientation:"LHS",width:20,height:10,unit:"ft",basePriceMonthly:130000,material:"P10 LED Panel",printSpec:"1920x960 LED, Full HD",illumination:"Self-Illuminated",traffic:"Very High",dailyImpression:62000,images:[],availability:{"2025-07":true,"2025-08":true,"2025-09":true,"2025-10":false},status:"available",holdBy:null,holdExpiry:null,holdDeposit:0,verified:true,gmapsLink:"https://maps.google.com/?q=18.6453,73.7966",redSquare:{x:195,y:65,w:250,h:140},rating:4.7,reviewCount:14 },
    { id:"H012",vendorId:"V003",title:"Viman Nagar Airport Road",location:"Viman Nagar Chowk, Near Pune Airport, Pune - 411014",lat:18.5641,lng:73.9141,type:"Backlit",orientation:"RHS",width:40,height:20,unit:"ft",basePriceMonthly:110000,material:"Star Flex 440 GSM",printSpec:"6x4 Solvent Print, 1440 DPI",illumination:"LED Backlit 6000K",traffic:"Very High",dailyImpression:70000,images:[],availability:{"2025-07":false,"2025-08":true,"2025-09":true,"2025-10":true},status:"available",holdBy:null,holdExpiry:null,holdDeposit:0,verified:true,gmapsLink:"https://maps.google.com/?q=18.5641,73.9141",redSquare:{x:120,y:80,w:360,h:180},rating:4.6,reviewCount:13 },
    { id:"H013",vendorId:"V001",title:"Hadapsar Magarpatta Ring Road",location:"Magarpatta Ring Road, Hadapsar, Pune - 411028",lat:18.5072,lng:73.9330,type:"Flex",orientation:"LHS",width:50,height:25,unit:"ft",basePriceMonthly:70000,material:"Star Flex 440 GSM",printSpec:"6x4 Solvent Print, 1440 DPI",illumination:"External LED Spots",traffic:"High",dailyImpression:45000,images:[],availability:{"2025-07":true,"2025-08":false,"2025-09":true,"2025-10":true},status:"available",holdBy:null,holdExpiry:null,holdDeposit:0,verified:false,gmapsLink:"https://maps.google.com/?q=18.5072,73.9330",redSquare:{x:75,y:100,w:450,h:200},rating:0,reviewCount:0 },
    { id:"H014",vendorId:"V002",title:"Katraj Bypass Highway",location:"Katraj Bypass Road, Pune - 411046",lat:18.4514,lng:73.8609,type:"Backlit",orientation:"RHS",width:35,height:18,unit:"ft",basePriceMonthly:65000,material:"Star Flex 440 GSM",printSpec:"6x4 Solvent Print, 1440 DPI",illumination:"LED Backlit 6000K",traffic:"High",dailyImpression:40000,images:[],availability:{"2025-07":true,"2025-08":true,"2025-09":true,"2025-10":false},status:"available",holdBy:null,holdExpiry:null,holdDeposit:0,verified:true,gmapsLink:"https://maps.google.com/?q=18.4514,73.8609",redSquare:{x:110,y:88,w:380,h:172},rating:4.0,reviewCount:6 },
    { id:"H015",vendorId:"V003",title:"Sangvi Kasarwadi Overbridge",location:"Kasarwadi Overbridge, Sangvi, PCMC - 411034",lat:18.5817,lng:73.8091,type:"Backlit",orientation:"LHS",width:30,height:15,unit:"ft",basePriceMonthly:58000,material:"Star Flex 440 GSM",printSpec:"6x4 Solvent Print, 1440 DPI",illumination:"LED Backlit 5500K",traffic:"Medium",dailyImpression:30000,images:[],availability:{"2025-07":true,"2025-08":true,"2025-09":false,"2025-10":true},status:"available",holdBy:null,holdExpiry:null,holdDeposit:0,verified:true,gmapsLink:"https://maps.google.com/?q=18.5817,73.8091",redSquare:{x:145,y:80,w:310,h:160},rating:3.8,reviewCount:3 }
  ],

  users: [
    { id:"SA001",role:"superadmin",name:"Spydee Admin",email:"admin@spydee.in",mobile:"9000000000",password:"Admin@123",verified:true,otpVerified:true,suspended:false,wallet:0,createdAt:"2024-01-01",lastActive:new Date().toISOString(),loginCount:42 },
    { id:"V001",role:"vendor",name:"Rajan Hoarding Co.",email:"rajan@hoardings.in",mobile:"9823001234",password:"Vendor@123",company:"Rajan Outdoor Pvt Ltd",gst:"27AABCR1234F1ZP",verified:true,otpVerified:true,suspended:false,wallet:150000,totalEarnings:340000,createdAt:"2024-02-15",lastActive:new Date().toISOString(),loginCount:28,inventoryIds:["H001","H002","H007","H010","H013"],rating:4.4,reviewCount:11 },
    { id:"V002",role:"vendor",name:"Mehta Media Works",email:"mehta@mediaworks.in",mobile:"9823005678",password:"Vendor@123",company:"Mehta Advertising Solutions",gst:"27AABCM5678G1ZQ",verified:true,otpVerified:true,suspended:false,wallet:90000,totalEarnings:215000,createdAt:"2024-03-10",lastActive:new Date().toISOString(),loginCount:19,inventoryIds:["H003","H004","H008","H011","H014"],rating:4.1,reviewCount:8 },
    { id:"V003",role:"vendor",name:"Suresh Outdoor Ads",email:"suresh@outdoorads.in",mobile:"9823009012",password:"Vendor@123",company:"Suresh Signages Ltd",gst:"27AABCS9012H1ZR",verified:true,otpVerified:true,suspended:false,wallet:120000,totalEarnings:178000,createdAt:"2024-04-05",lastActive:new Date().toISOString(),loginCount:22,inventoryIds:["H005","H006","H009","H012","H015"],rating:4.3,reviewCount:10 },
    { id:"C001",role:"customer",name:"Nikhil Joshi",email:"nikhil@techstartup.in",mobile:"9765432100",password:"Cust@123",company:"TechStartup Pune",gst:"27AABCN0001I1ZS",verified:true,otpVerified:true,suspended:false,wallet:500000,totalSpend:91800,createdAt:"2024-05-01",lastActive:new Date().toISOString(),loginCount:15,bookings:["BK001"],holds:[] },
    { id:"P001",role:"printer",name:"PrintMaster Pune",email:"print@printmaster.in",mobile:"9812345678",password:"Print@123",company:"PrintMaster Digital Solutions",gst:"27AABCP0001J1ZT",verified:true,otpVerified:true,suspended:false,wallet:75000,totalEarnings:28800,createdAt:"2024-05-15",lastActive:new Date().toISOString(),loginCount:11,acceptedJobs:[],completedJobs:["PJ001"],rating:4.7,reviewCount:6 }
  ],

  bookings: [
    { id:"BK001",customerId:"C001",hoardingId:"H001",vendorId:"V001",status:"confirmed",month:"2025-07",durationMonths:1,basePriceMonthly:85000,gst:15300,depositPaid:8500,totalDue:91800,printJob:"PJ001",createdAt:"2025-06-15",proofOfPerf:null,rating:4,review:"Great visibility on the junction",ratingDate:"2025-06-20" }
  ],

  printJobs: [
    { id:"PJ001",bookingId:"BK001",hoardingId:"H001",customerId:"C001",vendorId:"V001",printerId:"P001",status:"dispatched",dimensions:"40ft x 20ft",material:"Star Flex 440 GSM",printSpec:"6x4 Solvent Print, 1440 DPI",artworkUrl:null,sla:"3 days",priority:"normal",priceQuote:9600,createdAt:"2025-06-16",acceptedAt:"2025-06-17",dispatchedAt:"2025-06-19",trackingNote:"Delhivery AWB 87654321 · Delivered" }
  ],

  campaigns: [] // future: multi-city campaigns
};

// ── Utilities ───────────────────────────────────────────────
function haversineDistance(lat1,lng1,lat2,lng2) {
  const R=6371000,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function generateId(prefix) { return prefix+Date.now().toString(36).toUpperCase().slice(-6)+Math.random().toString(36).slice(-3).toUpperCase(); }
function formatCurrency(n) { return '₹'+Number(n||0).toLocaleString('en-IN'); }
function calcTax(base) {
  const gst=Math.round(base*0.18),deposit=Math.round(base*0.10),totalDue=(base+gst)-deposit;
  return { base, gst, deposit, totalDue };
}
function generateOTP() { return Math.floor(100000+Math.random()*900000).toString(); }
function starsHTML(rating,max=5) {
  let s='';
  for(let i=1;i<=max;i++) s+=`<span style="color:${i<=rating?'var(--amber)':'var(--text-dim)'}">${i<=rating?'★':'☆'}</span>`;
  return s;
}

// ── Injected from real GPS photo (Koregaon Park) ─────────────
// The uploaded image showed a hoarding at Lat 18.532622, Long 73.917669
// Taadi Gutta, Koregaon Park Annexe, Mundhwa, Pune - 411036
// This is auto-added as H016 under vendor V002
SPYDEE_DATA.hoardings.push({
  id:"H016",vendorId:"V002",
  title:"Koregaon Park Annexe Road Hoarding",
  location:"Taadi Gutta, Koregaon Park Annexe, Mundhwa, Pune - 411036",
  lat:18.532622,lng:73.917669,
  type:"Backlit",orientation:"LHS",width:20,height:10,unit:"ft",
  basePriceMonthly:95000,material:"Star Flex 440 GSM",
  printSpec:"6x4 Solvent Print, 1440 DPI",illumination:"LED Backlit 6500K",
  traffic:"High",dailyImpression:55000,images:[],
  availability:{"2025-07":true,"2025-08":true,"2025-09":true,"2025-10":true},
  status:"available",holdBy:null,holdExpiry:null,holdDeposit:0,
  verified:true,gmapsLink:"https://maps.google.com/?q=18.532622,73.917669",
  redSquare:{x:380,y:120,w:200,h:120},rating:4.3,reviewCount:5
});
