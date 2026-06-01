# 🕷 Spydee — Swiggy for Hoardings
### Hyper-local OOH Advertising Marketplace · Pune & PCMC

---

## 🚀 Project Structure

```
spydee/
├── index.html          # Entry point — open this in a browser
├── css/
│   └── styles.css      # Full design system (Syne + DM Sans fonts)
└── js/
    ├── data.js         # Mock dataset (15 hoarding sites, users, bookings)
    ├── state.js        # App state machine (auth, hold engine, CRUD)
    ├── landing.js      # Landing page + auth modals (login/register/OTP)
    ├── advertiser.js   # Customer discovery canvas + map + mockup viz
    ├── vendor.js       # Vendor inventory CRUD + schedule + proof of perf
    ├── admin-printer.js # Admin panel + printer job pool
    └── app.js          # Main renderer, shell, routing, toasts
```

---

## ⚡ Quick Start

### GitHub Pages (Zero Config)
1. Push this folder to a GitHub repo
2. Go to **Settings → Pages → Source: main branch / root**
3. Done. Access at `https://yourusername.github.io/spydee/`

### Local Development
```bash
# No build steps needed! Just serve statically:
npx serve .
# or
python3 -m http.server 8080
# Then open http://localhost:8080
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **SuperAdmin** | admin@spydee.in | Admin@123 |
| **Vendor** (Rajan) | rajan@hoardings.in | Vendor@123 |
| **Vendor** (Mehta) | mehta@mediaworks.in | Vendor@123 |
| **Customer** | nikhil@techstartup.in | Cust@123 |
| **Printer** | print@printmaster.in | Print@123 |

Or click any **Quick Login** button on the landing page.

---

## 🗺 Features

### All Users
- Role-based auth (Superadmin / Vendor / Customer / Printer — no cross-access)
- Email OTP verification (demo OTP shown in modal)
- Wallet system with live balance tracking

### 📢 Advertiser (Customer)
- Interactive map canvas with 15 Pune/PCMC hoarding pins
- Radius filter (500m–5km) with pin drop
- Granular filters: type, price range, vendor
- **12-Hour Lock Engine**: Reserve → countdown timer → confirm/cancel
- GST invoice math (18% GST, 10% deposit, balance due)
- Creative mockup visualizer with drag-and-drop + perspective transform
- Day/Night toggle with backlit glow simulation
- Booking management with print job creation

### 🏗 Vendor (Media Owner)
- Full CRUD for hoarding inventory
- Google Maps link input per hoarding
- Red square marker drag-to-position editor
- Availability calendar (toggle per month)
- Occupancy schedule grid
- Proof of Performance photo upload
- Pending payout tracking with GST breakdown
- Validation logs for admin approval status

### 🖨 Flex Printer
- Open job pool (live feed when advertiser creates print job)
- Accept job → In Progress → Dispatched SLA workflow
- Spec display: dimensions, material, print spec, client info
- Artwork download/upload

### ⚙️ SuperAdmin
- Platform stats dashboard (GMV, users, hoardings, bookings)
- Vendor verification with GST tracking
- Customer tracking (email, mobile, wallet, bookings)
- Hoarding approval/revoke
- All print jobs overview

---

## 🏙 Covered Locations (15 Sites)

| Area | Type |
|------|------|
| Wakad Junction | Backlit |
| Hinjawadi IT Park | Digital LED |
| Moshi Highway | Flex Unipole |
| Senapati Bapat Road | Backlit |
| Chandani Chowk | Backlit Gantry |
| Pimpri Camp | Backlit |
| Baner-Pashan Road | Digital LED |
| Nigdi-Akurdi Bypass | Flex |
| Kothrud Depot | Backlit |
| Aundh Pune University | Backlit |
| Chinchwad Station | Digital LED |
| Viman Nagar Airport | Backlit |
| Hadapsar Magarpatta | Flex |
| Katraj Bypass | Backlit |
| Sangvi Kasarwadi | Backlit |

---

## 💡 Tech Stack

- **HTML5** + **Vanilla JavaScript** (ES6+)
- **Tailwind CSS** (CDN) + Custom CSS with CSS variables
- **Fonts**: Syne (display) + DM Sans (body) + JetBrains Mono (code)
- **Storage**: localStorage for session persistence
- **Zero dependencies**: No NPM, no build step, no backend

---

## 🔧 Tax Engine

```
Base Price (monthly)   ₹XX,XXX
+ GST @ 18%            ₹X,XXX
= Gross Total          ₹XX,XXX
- 10% Deposit Paid     -₹X,XXX
= Balance Due          ₹XX,XXX
```

---

*Built with ❤️ for Pune's outdoor advertising ecosystem.*
