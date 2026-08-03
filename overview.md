# FloodAssist Assam — Overview

## What it is

**FloodAssist Assam** is a public web app that helps people in Assam quickly check flood situations, relief camps, emergency contacts, official updates, and curated outbound donation links during monsoon season.

It is **not** an official government system of record and is **not affiliated with ASDMA**. It presents figures from the official **ASDMA / SDRF Daily Flood Report** PDF in a cleaner, mobile-friendly interface, with preparedness tools (checklist, safety tips, SOS) alongside the data.

Live site: [floodassist-assam.vercel.app](https://floodassist-assam.vercel.app)

**Freshness:** Data is from the latest **daily** ASDMA report (not realtime gauges). The UI may say “Live Snapshot” meaning “latest imported report,” not minute-by-minute updates.

---

## Purpose

During floods, people need answers fast:

- Which districts are affected?
- How many people / villages / camps?
- Which rivers are above danger level?
- Where do I call?
- Where can I donate (outbound links only)?

Official reports exist as dense PDFs. This app turns that into searchable cards, a map, charts, one-tap emergency calling, and a donate directory that never collects money.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router |
| Motion | Framer Motion |
| Icons | Lucide React |
| Map | Leaflet + OpenStreetMap (react-leaflet) |
| Charts | Recharts (lazy-loaded) |
| Data access | Service modules over static JSON (`toUserError` helper; no axios until a backend exists) |
| Hosting | Vercel (SPA + security headers via `vercel.json`) |
| Data source | ASDMA / SDRF Daily Flood Report PDF (`sdrf.assam.gov.in/dfr`) |
| Scraper | Python 3 + `pdfplumber` + `requests` |

No backend server. The app ships static JSON under `src/data/` and is ready to swap those services for live APIs later.

---

## Features

### Core pages

1. **Home** — Hero, latest-report snapshot stats, daily brief, day-over-day comparison, severity ranking, river intelligence, situation guidance, trend charts, donate CTA, quick links.
2. **Flood Map** — Interactive OpenStreetMap with district pins, heat layer (Severe / Moderate / Waterlogging / Normal), filters, district search, district drawer.
3. **District Status** — Cards for every district with severity, villages, river, last updated; search + shareable deep links (`/districts?district=…`).
4. **Relief Camps** — District-level camp totals from ASDMA (addresses come from District Administration / 1077).
5. **Emergency Contacts** — Flood-first order: ASDMA (1079), SEOC (1070), Ambulance (108), Police (100), Fire (101), then District Control Room (1077).
6. **Donate** — `/donate` outbound links only (Bondhu Streams Assam Flood Relief, AFNA Flood Relief 2026). Strong disclaimers: no collection, no endorsement, no spend verification, not ASDMA. HTTPS host allowlist in the UI.
7. **Official Updates** — Timeline of report-derived advisories (ASDMA / CWC via the daily PDF).
8. **River & Impact Alerts** — CWC river danger levels and impact figures from the ASDMA PDF (not invented IMD weather).
9. **Emergency Checklist** — Interactive prep list with progress; saved in `localStorage`.
10. **Safety Tips** — Practical flood-safety cards.
11. **Past Reports** (`/timeline`) — Every imported report as a timeline item; `?date=` reloads the dashboard for that day.
12. **About** — Purpose and data disclaimer.

### Product extras

- Floating **SOS** button (top flood helplines, one-tap call)
- Dark mode
- Data freshness banner (latest report date + sync time)
- District insights drawer (population, villages, camps, inmates, lives lost, summary, share with encoded deep links)
- Report date filter on Home / Map / Districts / Camps / Weather
- Empty states and friendly error UI (no raw stack traces)
- Route-level code splitting (map + charts lazy-loaded)
- Error boundaries
- Responsive mobile-first UI
- Security headers (CSP, HSTS, `object-src 'none'`, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- Branch protection: data updates land via PR, not direct push to `main`
- GitHub repo may be **private**; the Vercel site stays public

### Intelligence (rule-based, not an LLM)

Built in `src/utils/intelligence.js` from the JSON. Component names may include `Ai*` for historical reasons — there is **no** ChatGPT / OpenAI / Anthropic call.

- **Daily Brief** — Natural-language summary of the selected report’s figures
- **Situation Comparison** — Today vs previous report deltas (↑/↓, improve/worsen colors)
- **Severity Ranking** — Top affected districts with progress bars
- **Trend Charts** — Population, camps, districts, river warnings over history
- **Situation Guidance** — Recommendations from thresholds; rebuilds whenever report stats / districts / rivers change
- **River Intelligence** — Status / trend / affected districts cards

All of this is derived from official numbers with transparent wording (“Generated from official ASDMA figures”).

---

## Data: what’s real

Flood figures come from the official ASDMA Daily Flood Report PDF:

- Affected population, villages, crop area
- Relief camps opened + camp inmates
- Human lives lost
- Revenue-circle detail where present
- Rivers flowing above danger / flood level (CWC via ASDMA)

**Important accuracy rules used in production:**

- No mock/dummy flood figures in live data files
- Map pins use district headquarters, not fake jittered coordinates
- Camps are **district aggregates** (individual camp street addresses are not invented)
- Severity badges (Severe / Moderate / …) are **app-derived** for UX, not an official ASDMA label field
- Water-level inventing / photo placeholders were removed
- Google Maps links only open when lat/lng are finite and inside an Assam / NE India buffer

Contacts and safety tips are curated official helplines / guidance, not scraped flood-day numbers.

Donate channels are curated Assam flood **2026** campaign pages; FloodAssist does not process payments.

### Key JSON under `src/data/`

| File | Role |
| --- | --- |
| `stats.json`, `districts.json`, `floodReports.json`, `reliefCamps.json` | Latest report dashboard |
| `weather.json`, `updates.json` | Rivers / impact + short advisories from the PDF |
| `history.json` | Past-report snapshots (Past Reports + trends) |
| `meta.json` | Report date, scrape time, source notes |
| `contacts.json`, `checklist.json`, `safetyTips.json` | Curated preparedness content |
| `donations.json` | Outbound donate channels + disclaimer note |
| `assamDistricts.geo.json` | Map polygons |

---

## How the data pipeline works

```
ASDMA DFR portal (PDF)
        │
        ▼
scripts/scrape_asdma_pdf.py
  • CSRF session + date walkback
  • download newest PDF (or --date YYYY-MM-DD)
  • pdfplumber parse
  • write JSON under src/data/
        │
        ▼
Git commit on branch data/asdma-refresh-YYYY-MM-DD
        │
        ▼
Pull request → human review → merge to main
        │
        ▼
Vercel redeploy → public site updates
```

### Scraper (`scripts/scrape_asdma_pdf.py`)

1. Opens `https://sdrf.assam.gov.in/dfr/download?type=flood`
2. Extracts CSRF token / session cookie
3. POSTs dates from today backward (`--lookback`) until a PDF is found
4. Parses tables for statewide rivers + per-district stats
5. Writes:
   - `districts.json`, `floodReports.json`, `reliefCamps.json`
   - `stats.json`, `weather.json`, `updates.json`
   - `history.json`, `meta.json`
6. Retries on connect/read timeouts (ASDMA can be slow or flaky)

Manual run:

```bash
python3 -m pip install -r scripts/requirements.txt
npm run scrape:pdf                               # newest available
python3 scripts/scrape_asdma_pdf.py --date 2026-07-31
```

### Why two update paths

| Path | Schedule | Reality |
| --- | --- | --- |
| **Manual / local scrape** | When you push a data PR | Primary path: `npm run scrape:pdf` (or Mac scheduler) → review → merge |
| **GitHub Actions** (`.github/workflows/scrape-asdma.yml`) | Manual `workflow_dispatch` only | **Daily cron disabled** — ASDMA is unreliable from GitHub runners |

Primary production refresh: **manual scrape + PR** (or local Mac scheduler). Do not rely on Actions cron.

```bash
./scripts/install_local_scheduler.sh install   # schedule
./scripts/install_local_scheduler.sh run-now   # scrape + PR now
./scripts/install_local_scheduler.sh status
```

Logs: `~/Library/Caches/FloodAssistAssam/logs/`

---

## Architecture (code)

```
src/
  pages/           # Route screens (incl. Donate, Timeline / Past Reports)
  components/      # UI, map, intelligence, layout, SOS
  services/        # Flood/district/camp/history/meta/… JSON access
  hooks/           # useFetch, useLocalStorage, useDarkMode
  utils/           # helpers (tel:, maps URL, nav) + intelligence generators
  data/            # JSON datasets (+ donations.json, history.json)
  assets/          # Hero photo, etc.
scripts/
  scrape_asdma_pdf.py
  scrape-asdma.mjs           # optional monthly DRIMS path
  local_refresh_asdma.sh
  install_local_scheduler.sh
.github/workflows/
  scrape-asdma.yml
```

**Design principle:** Most screens call **services → hooks → UI**. `Donate.jsx` reads `donations.json` directly (curated static list). Map loads GeoJSON in the map component. That keeps a clean path to replace flood JSON with REST later.

---

## How the frontend was built

1. **Product shell** — Navbar, footer, dark mode, routing, SOS modal, checklist with localStorage.
2. **Service + JSON architecture** — Districts, camps, contacts, updates, weather, stats, history behind services.
3. **ASDMA ingestion** — Python PDF scraper replaces mock data with real daily reports; history snapshots enable comparisons and charts.
4. **Intelligence layer** — Rule-based summaries, rankings, recommendations, river cards (updates with each new report).
5. **Map heat layer** — GeoJSON districts colored by severity; search + share.
6. **Donate directory** — Outbound Assam 2026 campaigns + factual disclaimers + host allowlist.
7. **Past Reports** — Date filter + timeline; shareable historical dashboards.
8. **Production hardening**
   - Remove fake fields
   - Escape map tooltip HTML (XSS)
   - Safe `tel:` helper; validated Google Maps URLs
   - Donate HTTPS domain allowlist
   - Error boundaries + mobile-friendly `ErrorState`
   - Lazy routes for Leaflet / Recharts
   - Security headers on Vercel (CSP, HSTS, `object-src 'none'`, …)
   - `.env` / `.env.*` gitignored
   - Dependabot
   - Branch protection + data PRs only
9. **Deploy** — Vite build on Vercel; merge to `main` triggers redeploy.

---

## Hosting & release flow

1. Connect GitHub repo `suvamneog/flood` to Vercel (Vite preset, `npm run build`, output `dist`). Private repos need the Vercel GitHub app authorized.
2. `vercel.json` provides SPA rewrites + CSP / HSTS / frame / referrer / permissions headers (mirrored in `public/_headers`).
3. Daily: scrape → data PR → review figures → merge → Vercel rebuilds.

---

## Disclaimer (keep visible)

This platform is for **informational** purposes. Always follow official updates from:

- ASDMA
- District Administration
- IMD / CWC as applicable

Emergency numbers are public helplines; confirm locally if unsure.

**Donate page:** FloodAssist does not collect money, endorse campaigns, or verify how funds are spent. Buttons open third-party sites only.

---

## Quick commands

```bash
# App
npm install
npm run dev
npm run build

# Scrape latest ASDMA PDF into src/data/
npm run scrape:pdf
python3 scripts/scrape_asdma_pdf.py --date YYYY-MM-DD

# Local twice-daily scheduler (Mac)
./scripts/install_local_scheduler.sh install
./scripts/install_local_scheduler.sh run-now
```

---

## Status summary

| Area | Status |
| --- | --- |
| Public UI | Production on Vercel |
| Data accuracy | Real ASDMA PDF figures (daily, not realtime) |
| Daily refresh | Local Mac scheduler / manual scrape + PR review |
| Donate | Outbound Bondhu Streams + AFNA; no payments on-site |
| Past Reports | History snapshots + date filter |
| Intelligence | Rule-based; updates with each report |
| GitHub Actions scrape | Cron off; optional manual dispatch only |
| Backend / live API | Not required for v1; service layer ready |
| Repo visibility | May be private; site remains public |

FloodAssist Assam is a **presentation and preparedness layer** over official ASDMA daily reports — designed to be clear on a phone when water is rising.
