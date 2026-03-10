# CHANGES.md — KibagRep Frontend Decision & Phase Log

This file tracks architectural decisions, scope changes, and phased feature development for the KibagRep frontend.

---

## Origin — Why This Exists

### Real-World Experience
The founder worked as a medical representative at two Ugandan pharmaceutical companies:

**Veeram:** Daily field reports submitted in Excel, emailed to managers. Managers actually read and responded. The accountability loop worked — a human was in the chain. Weakness: email doesn't scale, Excel has no structure enforcement, and data couldn't be aggregated across the team.

**Abacus / Mega — Phyzii system:** GPS was faked. Doctor lists changed without oversight. Managers had no reliable field view. The system captured inputs without producing accountability. The termination dispute at Abacus was partly caused by inconsistent, unreliable system logs — a problem a well-built system solves.

### The Broader Market Problem
Every new medical rep in Uganda inherits a stale Excel doctor list. Doctors move facilities, change phones, retire. Within months, 20–30% of the list is wrong. Companies spend weeks (and rep time) re-validating data. This is not a data entry problem — it's a structural problem that requires doctors to own their data.

### The Business Insight
**KibagRep doesn't just serve pharma companies. It serves the entire ecosystem:**
- Pharma companies get a reliable SFA and a verified doctor database
- Doctors get control over who visits them and a digital CME record
- Pharmacies get a structured channel for reporting sales data
- KibagRep owns the data layer that connects all three

This is how the platform becomes defensible: once the doctor database is verified and live, no competitor can replicate it without starting from scratch.

### Competitive Benchmark
- **Salesdoor:** Best UX of the three. Clear dashboards. USD-priced, US-focused.
- **SaneForce:** Strong on target/actual tracking and call cycle management. Enterprise-heavy.
- **Phyzii:** Used directly in the field. Failed on GPS integrity, report quality, and system reliability.

KibagRep goal: Salesdoor's UX, SaneForce's structure, built for Uganda from the ground up.

---

## Phase 0 — Foundation ✅ COMPLETE
**Goal:** Core dashboard UI for all internal roles. Auth layer connected to backend.

### What's Built
- [x] Landing page (Homepage) — hero, features, highlights, CTA
- [x] Login + Signup pages (Authentication) — connected to JWT API, role-based redirect
- [x] Medical Rep dashboard (RepPage) — Home, Tasks, LogVisitModal, FAB, live ActivityCards
- [x] Supervisor dashboard (SupervisorPage) — rep list, flagged reps, approval stubs
- [x] Manager dashboard (ManagerPage) — Dashboard, Messaging, KPI cards, charts
- [x] Admin/HR dashboard skeleton (AdminPage + AdminDashboard)
- [x] Country Manager dashboard (CountryPage) — KPIs, manager performance, regional coverage, campaigns
- [x] Sales Admin panel (SalesAdminPage) — master data counts, quick actions, upload log, tier distribution
- [x] Shared components: Bargraph, DognutPie, DatePicker, AddUnplanned, NcaPopup, LogVisitModal
- [x] Redux store: uiStateSlice (menus/modals) + authSlice (user, token, role)
- [x] Redux Persist configured
- [x] Role-based route protection (ProtectedRoute) on all dashboards
- [x] JWT auth integration — login → token → axios interceptor → auto-logout on 401
- [x] Doctor search + autocomplete in LogVisitModal (pulls from master DB)
- [x] Visit log form: doctor, focused product, products detailed, samples, outcome
- [x] ActivityCards wired to real API (GET /field-doctor/today) with live refresh
- [x] Floating Action Button on RepPage (Log Visit)
- [x] Login role-based redirect: MedicalRep→/rep-page, Supervisor→/supervisor, Manager→/manager, COUNTRY_MGR→/country, SALES_ADMIN→/sales-admin

### Stack (Phase 0)
- React 18 + TypeScript + Vite
- React Router v7, Redux Toolkit + Persist
- Tailwind CSS, Ant Design Plots
- No PWA/service worker yet — validate flows first

---

## Phase 1 — Connected, Enforced & Mobile-First
**Goal:** All internal dashboards live on real API. Call cycles enforced. GPS integrity active. Expense claims running.

### New Features — Internal (Pharma Staff)

**Auth & Tenancy**
- [ ] JWT auth integration — protected routes, token refresh, tenant scoping
- [ ] Multi-tenant context: every API call scoped to current pharma company

**Medical Rep**
- [ ] Full visit logging: doctor selection from master DB, detailing time, products, outcome, samples
- [ ] GPS check-in/check-out with anomaly warning if location doesn't match facility
- [ ] Call cycle view: approved monthly doctor list, color-coded by tier (A/B/C) and due status
- [ ] Campaign brief card: active marketing campaign, products to push, target doctors
- [ ] Expense claim form: transport, accommodation, meals, promotional items with receipt upload
- [ ] Offline visit queue (IndexedDB → sync on reconnect)
- [ ] Daily report submission with summary

**Supervisor**
- [ ] Rep activity feed: visits logged today, pending reports
- [ ] Approve/reject daily reports with comment
- [ ] Call cycle approval: review and lock rep's monthly doctor list
- [ ] Expense claim approval
- [ ] JFW form: log coaching visit, score detailing quality, add feedback
- [ ] System flags: reps with GPS anomalies, NCA streaks, low call cycle coverage

**Manager**
- [ ] Drill-down: team → supervisor → rep → individual visit
- [ ] Campaign performance overlay: which reps are delivering the message
- [ ] Approve escalations from supervisors
- [ ] Generate and download team performance report (Excel)

**Sales Admin**
- [ ] Bulk Excel upload for doctors, pharmacies, facilities
- [ ] Doctor tier assignment (A/B/C) by specialty or facility type
- [ ] Call cycle template management by territory

**Country Manager**
- [ ] Territory heatmap (Leaflet): visit density by region, clickable
- [ ] Competitor intelligence summary aggregated from rep logs
- [ ] Product performance by region

### New Features — External Portals (Phase 1)

**Doctor Portal**
- [ ] Doctor claim/verify profile via SMS OTP
- [ ] Update: specialty, facility, working hours, preferred visit days
- [ ] Opt-in/out of visits from specific pharma companies
- [ ] View CME history and add new entries
- [ ] View sample receipt history
- [ ] Receive e-detailing materials from reps

**Pharmacy Portal**
- [ ] Pharmacy claim/verify via SMS OTP
- [ ] Update profile: location, hours, contact
- [ ] Monthly sales report form: product, units sold, stock remaining
- [ ] View rep visit history for their pharmacy

### UI Enhancements
- [ ] Collapsible sidebar on desktop, hamburger on mobile
- [ ] Color-coded KPI cards with progress bars (A/B/C tier visits, targets)
- [ ] Unified chart color palette across all dashboards
- [ ] Swipeable tabs on mobile (Activity / Campaigns / Expenses / Performance)
- [ ] Inline task completion (Mark as Done without reload)
- [ ] Rep leaderboard (calls, detailing quality, samples given)
- [ ] Global search: doctors, pharmacies, reps, visit history
- [ ] Calendar: Day / Week / Month view toggle
- [ ] Export: PDF and Excel per role

---

## Phase 2 — Doctor Incentives, Campaign Intelligence & Pharmacy Sales
**Goal:** Marketing campaigns, CME/incentive compliance, pharmacy sell-out data, competitor intelligence.

### New Features

**Campaign Management**
- [ ] Campaign builder UI (for marketing/manager): product, target tier, messaging, duration, materials
- [ ] Rep campaign adoption tracking: did they detail the campaign product?
- [ ] Pre/post campaign sales comparison by territory
- [ ] Campaign ROI dashboard for Head of Sales/Marketing

**Doctor Incentive & CME Compliance**
- [ ] Log CME events: date, venue, doctors attended, sponsoring company, cost per head
- [ ] Log branded items given: item, value, doctor, rep, date
- [ ] Advisory board fee tracking: doctor, amount, purpose, approval status
- [ ] Aggregate compliance report: total spend per doctor, per company, per period
- [ ] NDA (National Drug Authority) compliance flags: alert when a doctor exceeds gift value thresholds

**Pharmacy Sales Consolidation**
- [ ] Pharmacy sales dashboard: sell-out data aggregated from pharmacy self-reports
- [ ] Market share view per product per region (based on pharmacy data)
- [ ] Stockout alerts: pharmacy stock below threshold → assign rep follow-up
- [ ] Distribution gap map: pharmacies not yet stocking a product (Leaflet overlay)

**Analytics & Intelligence**
- [ ] Doctor frequency analytics: over-visited and under-visited doctors by tier
- [ ] GPS anomaly report: check-ins flagged as geographically impossible
- [ ] Competitor intelligence dashboard: which competitor products appear most in rep field notes, by region and specialty
- [ ] E-detailing analytics: which slides were shown, for how long, doctor response score

---

## Phase 3 — East Africa Expansion & Platform Intelligence
**Goal:** Expand to Kenya, Tanzania, Rwanda. Add AI features. Open API.

### New Features
- [ ] Multi-country support: country-specific doctor DBs, regulatory rules, currency
- [ ] AI reply suggestions for manager feedback on reports
- [ ] AI conversation summary for rep visit notes
- [ ] White-label theming for enterprise pharma company clients
- [ ] Medical device vertical: same rep/visit model, new product category
- [ ] Public API with API keys for ERP/CRM integrations

---

## Decision Log

| Date | Decision | Reasoning |
|------|----------|-----------|
| 2026-03-08 | React + Vite over Next.js | Fully authenticated app — no SEO need. Vite gives faster dev iteration for dashboard-heavy UI. |
| 2026-03-08 | Tailwind + Ant Design Plots | Tailwind for layout/spacing, Ant Design Plots for charts. Avoids building chart primitives from scratch. |
| 2026-03-08 | Redux Toolkit + Persist | Multi-tab state and offline resilience. Persist critical so rep doesn't lose form state if they switch apps mid-visit. |
| 2026-03-08 | Green as brand primary | Medical + field + Uganda → nature/health associations. Avoids the generic SaaS blue. |
| 2026-03-08 | Mobile-first mandatory | Reps use phones in the field on 3G. Desktop dashboards are secondary (for managers). |
| 2026-03-08 | Offline-first deferred to Phase 1 | Service worker adds complexity. Phase 0 validates the data model and flows first. |
| 2026-03-08 | Role pages separated per folder | Clear separation prevents role logic leaking across components. Each role owns its folder. |
| 2026-03-08 | Doctor and pharmacy portals as separate page trees | They have different auth flows (OTP vs password), different data access, and should never share session context with pharma company portals. |
| 2026-03-08 | Leaflet over Google Maps | Open source, no API billing surprise, works offline-capable with tile caching. Good enough for Uganda region heatmaps. |
| 2026-03-08 | KibagRep owns the doctor database | Doctors update their own data via the portal. Pharma companies access a verified, living dataset rather than maintaining stale Excel lists. This is the core business moat. |
| 2026-03-08 | Doctor portal uses SMS OTP not password | Doctors won't remember a password to a system they use once a quarter. OTP to their registered number is frictionless. |
| 2026-03-08 | Campaign management in Phase 2 not Phase 0 | Need real visit data first before campaign overlays are meaningful. Build the measurement layer before the campaign layer. |
