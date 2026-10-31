# LEX GLOBAL ADVOCACY LLP — Complete Deployment & Operations Manual
**Firm Registration:** LLPIN ACK-4630, Mumbai & Savannah &middot; 42+ Global Arbitral Seats

This package contains the complete, production-grade codebase for **LEX GLOBAL ADVOCACY LLP** with separated **Frontend** and **Backend** directories, fully functional **Courses & Academy Masterclasses**, **The Legal Hub & Publications**, and an authenticated **Partner & Staff Admin Portal**.

---

## 📁 Separated Directory Architecture

```
deploy/
├── frontend/                     # Pure Static Client (No Node.js build required)
│   ├── index.html                # Main portal: Hero, Practices, Academy, Blog, Intake
│   ├── admin.html                # Partner & Staff Executive Admin Portal
│   └── README.md                 # Frontend hosting guide (Vercel, Netlify, Cloudflare)
│
├── backend/                      # Production REST API Service (Node.js + Express)
│   ├── server.js                 # Express API server with CORS, Rate Limiting & Auth
│   ├── package.json              # Backend dependencies (express, cors, dotenv)
│   ├── .env.example              # Environment variables template
│   ├── Dockerfile                # 1-click Docker container deployment
│   ├── data/
│   │   └── db.json               # Persistent JSON database (courses, blogs, inquiries)
│   └── README.md                 # Backend hosting guide (Render, Railway, VPS)
│
└── README.md                     # Master Operations & Deployment Guide (This file)
```

---

## 🎓 New Section: Legal Academy & Executive Masterclasses

The website now features a fully functional **Courses & Academy** section (`#courses`) designed for practitioners, corporate counsel, and scholars:

1. **International Commercial Arbitration: Strategy & Award Enforcement**
   - *Faculty:* Dr. Amara Okonkwo (Arbitrator on LCIA, SIAC & ICC Panels)
   - *Duration & Credits:* 8 weeks &middot; 24 lectures &middot; 16 CLE Credits
   - *Curriculum Highlights:* New York Convention 1958 Article V defenses, emergency arbitrator injunctions, IBA evidentiary schedules, cross-border asset attachment.

2. **Cross-Border Contract Drafting, Joint Ventures & Risk Allocation**
   - *Faculty:* Adv. Priya Menon (Partner, Cross-Border M&A Practice)
   - *Duration & Credits:* 6 weeks &middot; 18 lectures &middot; 12 CLE Credits
   - *Curriculum Highlights:* Common law vs civil law indemnities, deadlock mechanisms (Russian Roulette & Texas Shootout), Incoterms 2020 harmonisation.

3. **Global Data Privacy, GDPR & India DPDP Act 2023 Masterclass**
   - *Faculty:* Dr. Sofia Lindqvist (Head of Data & Privacy, Former EU Regulatory Counsel)
   - *Duration & Credits:* 7 weeks &middot; 21 lectures &middot; 14 CPD Credits
   - *Curriculum Highlights:* Transfer Impact Assessments (TIAs) post-Schrems II, EU AI Act compliance, 72-hour mandatory breach command unit.

4. **Admiralty Practice, Ship Arrests & Maritime Liens**
   - *Faculty:* Kathleen Horne (Partner, Admiralty Practice)
   - *Duration & Credits:* 6 weeks &middot; 18 lectures &middot; 12 CLE Credits
   - *Curriculum Highlights:* 1952 & 1999 Arrest Conventions, caveats & ex parte warrants, sister-ship arrest doctrines, P&I Club Letters of Undertaking.

5. **Real Estate Title Diligence, Commercial Conveyancing & MahaRERA**
   - *Faculty:* B. H. Levy, Jr. (Senior Counsel, Real Estate Practice)
   - *Duration & Credits:* 8 weeks &middot; 24 lectures &middot; 16 CLE Credits
   - *Curriculum Highlights:* 30-to-50-year chain of title review, 7/12 extracts & mutation registers, NA conversions, MahaRERA complaints & deemed conveyances.

6. **The Art of Appellate Advocacy & Plain-Language Legal Drafting**
   - *Faculty:* Margaret W.S. Puccini (Senior Managing Partner & Appellate Counsel)
   - *Duration & Credits:* 5 weeks &middot; 15 lectures &middot; 10 CLE Credits
   - *Curriculum Highlights:* Eliminating legalese, Bottom-Line-Up-Front (BLUF) persuasive structure, Question Presented framing, oral bench pivoting.

### Interactive Features:
- **Filter Tabs:** Instant category filtering across Arbitration, Contracts, Privacy, Maritime, Real Estate, and Advocacy.
- **Curriculum Modal:** Interactive breakdown of modules, lesson topics, lecture duration, format (video, lab, drafting workshop), and learning outcomes.
- **Live Enrollment Application:** Instant registration form capturing candidate details, preferred track (*Live Interactive Weekend Cohort* vs *Executive Self-Paced*), and generating an **Official Student Admission Pass** with unique Registration ID (`LGA-ACAD-XXXX`).

---

## 🔐 How to Access the Admin Portal in Deployed Website

### 1. Direct URL Path
On your deployed domain, navigate directly to:
```
https://your-domain.com/admin.html
```
*(Or `https://your-domain.com/admin` if deploying on Node.js/Express).*

### 2. Header and Footer Shortcuts
- **Header:** Click the discreet **Portal** button with shield icon on the top right navigation bar.
- **Footer:** Click the **Partner / Staff Portal** link in the copyright footer.

### 3. Login Credentials
- **Username:** `admin`
- **Master Password:** `lexglobal2026`
*(You can customize this password anytime in the **Security & Backups** tab or via the `ADMIN_PASSWORD` environment variable).*

### 4. Admin Portal Capabilities
- **Overview Dashboard:** Live KPI counters for total client inquiries, enrolled candidates, active courses, and publications.
- **Client Inquiries & Retainers:** View, search, and filter privileged consultation intakes. Change status (*New*, *Under Review*, *Cleared*) and click **Export CSV** to download client records.
- **Courses & Academy Manager:** View enrolled practitioners per masterclass, add new executive courses with custom syllabi, and manage tuition fees.
- **Publications & Blogs Manager:** Create new scholarly articles with rich content, read times, and tags; edit or draft posts.
- **Security & Backups:** Update master administrator password and click **Download db.json Backup** to export an offline snapshot of the database.

---

## 🚀 Step-by-Step Deployment Instructions

### Method A: Separated Deployment (Frontend on Vercel / Netlify + Backend on Render / Railway)

This is the recommended modern architecture.

#### Step 1: Deploy Backend (Render.com)
1. Push `deploy/backend/` to a GitHub repository.
2. Sign in to [Render.com](https://render.com) and click **New +** &rarr; **Web Service**.
3. Select your repository.
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `node server.js`
6. Add Environment Variables:
   - `ADMIN_PASSWORD`: `your_secure_admin_password`
   - `CORS_ORIGIN`: `*`
7. Click **Create Web Service**. Note your backend URL (e.g. `https://lex-backend.onrender.com`).

#### Step 2: Configure & Deploy Frontend (Vercel or Netlify)
1. Open `deploy/frontend/index.html` and `deploy/frontend/admin.html`.
2. Locate the line near the start of the `<script>` tag:
   ```javascript
   window.LEX_API_URL = window.LEX_API_URL || '';
   ```
   Set it to your Render backend URL:
   ```javascript
   window.LEX_API_URL = 'https://lex-backend.onrender.com';
   ```
3. Drag and drop the `deploy/frontend` folder to [Vercel](https://vercel.com) or [Netlify Drop](https://app.netlify.com/drop).
4. Your website is live!

---

### Method B: Unified 1-Click Deployment (Single Node.js Host)

If you prefer running frontend and backend together under a single domain:

1. Copy `index.html` and `admin.html` from `deploy/frontend/` into a `public/` folder inside `deploy/backend/`.
2. In `deploy/backend/server.js`, add:
   ```javascript
   app.use(express.static(path.join(__dirname, 'public')));
   app.get(['/admin', '/admin.html'], (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
   app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
   ```
3. Deploy the backend folder to Render, Railway, DigitalOcean App Platform, or Heroku.
4. Your entire website and admin portal will be served on the root URL.

---

### Method C: Traditional VPS (Ubuntu Linux / Nginx / PM2)

1. Connect to your VPS via SSH:
   ```bash
   ssh root@your-server-ip
   ```
2. Clone your files to `/var/www/lex-global/`.
3. In `backend/`, install packages and start the background daemon:
   ```bash
   cd /var/www/lex-global/deploy/backend
   npm install --production
   pm2 start server.js --name "lex-api"
   pm2 save
   ```
4. Configure Nginx to serve the `frontend/` folder statically on port 80/443 and proxy `/api` requests to `http://127.0.0.1:5000`.

---

## 🛡️ Security Hardening Included
- **Cryptographic Token Authorization:** Admin actions require cryptographically randomized bearer tokens.
- **Sliding-Window Rate Limiting:** Form submission endpoints are throttled to prevent spam and denial-of-service.
- **Defense-in-Depth Sanitization:** All text inputs are stripped of malicious script injection payloads.
- **Strict HTTP Headers:** Configured with `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.
