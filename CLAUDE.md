# CLAUDE.md — KibagRep Frontend Rules

## Project Overview

**KibagRep** is a Medical Sales Force Automation (SFA) platform and HCP data layer for pharmaceutical companies in Uganda and East Africa. It digitizes the daily workflow of medical representatives, supervisors, managers, and country managers — and extends to doctors and pharmacies who manage their own profiles directly on the platform.

**Origin:** Built from first-hand experience working as a medical rep at Veeram and Abacus/Mega. At Veeram, daily Excel reports emailed to managers created real accountability. At Mega/Abacus, Phyzii captured inputs without enforcing outcomes — GPS was faked, doctor lists changed arbitrarily, and managers had no reliable view of the field.

**What makes KibagRep different:**
- KibagRep **owns the master doctor and pharmacy database** for Uganda. Pharma companies subscribe and their reps work off verified, live data — not stale Excel lists.
- Doctors and pharmacies **self-manage their profiles** on the platform, keeping data fresh at the source.
- The system enforces **call cycles, GPS integrity, and approval chains** — the accountability loop that Phyzii never had.
- **Doctor incentives, CME tracking, and marketing campaigns** are first-class features, not afterthoughts.

**Business model:** Multi-tenant SaaS. KibagRep owns the HCP data layer. Pharma companies pay per rep seat. Data is the moat; the SFA is the product.

**Long-term vision:** The default field force platform and HCP intelligence layer for East Africa — starting with Uganda pharmaceutical reps, expanding to medical devices, FMCG, and other regulated field sales.

See [CHANGES.md](./CHANGES.md) for phase roadmap and architectural decisions log.

---

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

---

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

---

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** as build tool
- **React Router v7** for routing
- **Redux Toolkit + Redux Persist** for global state
- **Tailwind CSS** for styling — custom brand colors only, never default Tailwind palette
- **Ant Design Plots** for charts and data visualization
- **React Icons** for icons
- **date-fns** for date formatting
- **Leaflet / React Leaflet** — territory and coverage maps (Phase 1)

### Design System Rules
- **Colors:** Brand primary is green (`#16a34a` range). Never use default Tailwind blue/indigo as primary.
- **Shadows:** Layered, color-tinted shadows with low opacity — never flat `shadow-md`.
- **Typography:** Pair a display font for headings with a clean sans for body. Tight tracking on headings, generous line-height on body.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`.
- **Interactive states:** Every button/link needs hover, focus-visible, and active states.
- **Spacing:** Consistent spacing tokens, not random Tailwind steps.
- **Mobile-first:** All dashboards must work on mobile — collapsible sidebars, stacked cards, FABs.

---

## Folder Structure

```
KibagRep-frontend/
├── src/
│   ├── pages/
│   │   ├── Homepage/               # Public landing page
│   │   ├── Authentication/         # Login, Signup
│   │   ├── RepPage/                # Medical Rep dashboard
│   │   ├── SupervisorPage/         # Supervisor dashboard
│   │   ├── ManagerPage/            # Manager dashboard
│   │   ├── AdminPage/              # HR/Admin panel
│   │   ├── CountryPage/            # Country Manager dashboard
│   │   ├── AdminDashboard/         # Supervisor/Admin activity dashboard
│   │   ├── DoctorPortal/           # Doctor self-service profile & preferences
│   │   └── PharmacyPortal/         # Pharmacy self-reporting portal
│   ├── componets/                  # Shared reusable components
│   │   ├── Bargraph/
│   │   ├── DognutPie/
│   │   ├── DatePicker/
│   │   ├── AddUnplanned/           # Modal for logging unplanned visits
│   │   ├── NcaPopup/               # No-Customer-Activity popup
│   │   ├── CoverageMap/            # Territory heatmap (Leaflet)
│   │   ├── CallCycleEditor/        # Supervisor approves rep's monthly doctor list
│   │   ├── ExpenseClaimForm/       # Rep submits expense claims
│   │   ├── CampaignBrief/          # Shows active campaign to rep
│   │   ├── IncentiveTracker/       # CME, samples, branded items log
│   │   └── ...
│   ├── store/                      # Redux Toolkit slices
│   │   ├── uiStateSlice.ts         # UI toggles (menu, modals)
│   │   ├── authSlice.ts            # Current user, role, tenant
│   │   └── offlineQueueSlice.ts    # Queued visits for offline sync
│   ├── context/                    # React Context (AppContext)
│   └── App.tsx
├── CLAUDE.md
└── CHANGES.md
```

---

## Portal Types & Routing

### Internal Portals (Pharma company staff — requires company login)

| Role | Route | Dashboard |
|------|-------|-----------|
| Medical Rep | `/rep` | RepPage — daily calls, detailing, tasks, call cycle |
| Supervisor | `/supervisor` | SupervisorPage — team activity, report approval, JFW |
| Manager (FLM) | `/manager` | ManagerPage — team KPIs, visits trend, campaigns |
| Admin (HR) | `/admin` | AdminPage — leave, welfare, training, compliance |
| Country Manager | `/country` | CountryPage — national KPIs, heatmap, all companies |
| Sales Admin | `/sales-admin` | Master data config, bulk upload, call cycles, reports |

### External Portals (Independent logins — not pharma company staff)

| Portal | Route | Purpose |
|--------|-------|---------|
| Doctor Portal | `/doctor` | Doctor updates own profile, preferences, CME records |
| Pharmacy Portal | `/pharmacy` | Pharmacy reports monthly sales, manages stock visibility |

All routes are protected. Unauthenticated users redirect to `/login`. Doctor and pharmacy portals use separate auth flows (OTP to registered phone).

---

## UX Philosophy

> Think field-first. A rep is on 3G visiting 10 doctors a day. A doctor is between patients with 90 seconds to update their profile. Every screen has one job.

- **One job per screen** — rep logs a visit in 3 taps. Doctor updates facility in 2 taps.
- **Offline-first for reps** — visits logged offline, synced on reconnect. Never lose field data.
- **Real-time feedback** — rep sees daily target completion without navigating away.
- **Managers see red flags on load** — missed visits, GPS anomalies, NCA streaks, overdue approvals.
- **Doctors control their experience** — they choose which companies can detail them and when.
- **Pharmacies stay light** — pharmacy portal is a simple monthly form, not a full dashboard.
- **No hidden navigation** — role-appropriate sidebar always visible. Hamburger on mobile.
- **Search is global** — "Dr. Kato" finds the doctor, their profile, visit history, and next planned visit.

---

## Dashboard Sections by Role

### Medical Rep Dashboard
- KPI cards: Visits today / Call cycle progress / Detailing done / NCA count / Samples remaining
- Call cycle view: which doctors are due this week (color-coded by tier A/B/C)
- Daily visit calendar (list + map toggle)
- Active campaign brief (what marketing wants pushed this month)
- Floating Action Button: + Log Visit / + NCA / + Unplanned
- Task list with urgency labels (High / Medium / Low)
- Expense claims: submit and track status
- Submit daily report button

### Supervisor Dashboard
- Rep list with: visit completion %, call cycle adherence, pending reports
- Approve / reject rep daily reports with comment
- Approve / reject call cycle changes (doctor list modifications)
- Approve / reject expense claims
- JFW (Joint Field Work) log: schedule coaching visits, submit scores
- Donut chart: target achievement per rep
- Reps needing attention (flagged by system: NCA streaks, GPS anomalies, low cycle coverage)

### Manager (FLM) Dashboard
- Team sales vs target (stacked bar)
- Visits trend (line chart, daily/weekly)
- Campaign performance: which reps are delivering the campaign message
- Rep leaderboard (calls done, detailing quality, samples given)
- Pending approvals count (escalations from supervisors)
- Drill-down: team → supervisor → rep

### Admin Dashboard (HR)
- Leave requests (pending / approved)
- Employee distribution by role and region (pie chart)
- Training completion (bar chart per team)
- Welfare issue log
- Compliance: reps who haven't submitted reports this week

### Country Manager Dashboard
- National KPIs: total reps / visits this month / sales vs target / active campaigns
- Geographic heatmap: visit coverage density by region
- Manager performance comparison (bar chart)
- Product performance (pie chart)
- Competitor intelligence summary (what competitors are reps seeing in the field)
- Drill-down: country → region → manager → supervisor → rep

### Sales Admin Panel
- Master data management: doctors, pharmacies, facilities, products
- Bulk Excel upload for doctor/pharmacy lists
- Call cycle templates per territory
- Report generation: custom filters (rep, date, product, region)
- Doctor tier assignment (A/B/C) in bulk

### Doctor Portal
- Claim and verify profile (SMS OTP)
- Update: specialty, facility, working hours, preferred visit days, contact
- View which companies have them in their call list
- Opt-in/out of visits from specific pharma companies
- CME credit log: events attended, sponsoring company, credits earned
- Sample history: what has been received and when
- Receive digital detailing materials (e-detailing via in-app viewer)

### Pharmacy Portal
- Claim and verify pharmacy profile (SMS OTP)
- Update: location, operating hours, contact person
- Monthly sales reporting: product, units sold, units remaining
- View outstanding orders placed by reps
- Stock alert: flag when a product is running low

---

## Core Components

| Component | Purpose |
|-----------|---------|
| `AddUnplanned` | Modal for logging unplanned doctor visits |
| `NcaPopup` | Log No-Customer-Activity with reason |
| `Bargraph` | Reusable bar chart (Ant Design Plots wrapper) |
| `DognutPie` | Donut chart for target % and product splits |
| `DatePicker` | Unified date selector across all views |
| `MenuPopup` | Role-aware navigation popup |
| `CoverageMap` | Leaflet map showing territory coverage heatmap |
| `CallCycleEditor` | Drag/approve interface for monthly doctor visit plan |
| `ExpenseClaimForm` | Tabbed form: transport / accommodation / meals / promo items |
| `CampaignBrief` | Card showing active campaign, products to push, target doctors |
| `IncentiveTracker` | Log CME attendance, branded items, advisory fees per doctor |
| `JFWForm` | Joint Field Work scoring form for supervisor coaching visits |
| `CompetitorLogModal` | Log competitor product observation during a visit |
| `BulkUploader` | Drag-drop Excel upload for master data (Sales Admin) |
| `RequestDemo` | Landing page demo request form |

---

## Anti-Generic Guardrails
- Never use default Tailwind `blue-*` or `indigo-*` as primary brand color
- Never use `transition-all`
- Never leave a button without hover + focus-visible states
- Never build a new page without mobile layout considered first
- Never hardcode doctor/facility names — always pull from API or Redux store
- Never skip loading and error states on async data
- Never mix internal (pharma staff) and external (doctor/pharmacy) auth flows
- Never show one tenant's data to another tenant — always scope API calls to current tenant

---

## Hard Rules
- Do not add features not in the spec or reference
- Do not stop after one screenshot pass when matching a reference
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
- Do not hardcode role logic inline — use a central `roles` config
- Do not commit API keys or `.env` values
- Doctor and pharmacy portals are separate auth flows — never share session tokens with pharma company portals
- Tenant ID must always be included in API requests from internal portals
