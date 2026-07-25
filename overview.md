# FloodAssist Assam — Overview

## What it is

**FloodAssist Assam** is a public web app that helps people in Assam quickly check flood situations, relief camps, emergency contacts, and official updates during monsoon season.

It is **not** an official government system of record. It presents figures from the official **ASDMA / SDRF Daily Flood Report** PDF in a cleaner, mobile-friendly interface, with preparedness tools (checklist, safety tips, SOS) alongside the data.

Live site (example): [floodassist-assam.vercel.app](https://floodassist-assam.vercel.app)

---

## Purpose

During floods, people need answers fast:

- Which districts are affected?
- How many people / villages / camps?
- Which rivers are above danger level?
- Where do I call?

Official reports exist as dense PDFs. This app turns that into searchable cards, a map, charts, and one-tap emergency calling.

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
| Data fetch layer | Service modules (+ Axios ready for future APIs) |
| Hosting | Vercel (SPA + security headers via `vercel.json`) |
| Data source | ASDMA / SDRF Daily Flood Report PDF (`sdrf.assam.gov.in/dfr`) |
| Scraper | Python 3 + `pdfplumber` + `requests` |

No backend server. The app ships static JSON under `src/data/` and is ready to swap those services for live APIs later.

---

## Features

### Core pages

1. **Home** — Hero, live snapshot stats, daily brief, day-over-day comparison, severity ranking, river intelligence, situation guidance, trend charts, quick links.
2. **Flood Map** — Interactive OpenStreetMap with district pins, heat layer (Severe / Moderate / Waterlogging / Normal), filters, district search, district drawer.
3. **District Status** — Cards for every district with severity, villages, river, last updated; search + shareable deep links (`/districts?district=…`).
4. **Relief Camps** — District-level camp totals from ASDMA (addresses come from District Administration / 1077).
5. **Emergency Contacts** — Flood-first order: ASDMA (1079), SEOC (1070), Ambulance (108), Police (100), Fire (101), then District Control Room (1077).
6. **Official Updates** — Timeline of report-derived advisories.
7. **River & Impact Alerts** — CWC river danger levels and impact figures from the ASDMA PDF (not invented IMD weather).
8. **Emergency Checklist** — Interactive prep list with progress; saved in `localStorage`.
9. **Safety Tips** — Practical flood-safety cards.
10. **Report Timeline** — Every imported report as a timeline item; clicking a date reloads the dashboard for that day.
11. **About** — Purpose and data disclaimer.

### Product extras

- Floating **SOS** button (top flood helplines, one-tap call)
- Dark mode
- Data freshness banner (latest report date + sync time)
- District insights drawer (population, villages, camps, inmates, lives lost, summary, share)
- Empty states and friendly error UI (no raw stack traces)
- Route-level code splitting (map + charts lazy-loaded)
- Error boundaries
- Responsive mobile-first UI
- Security headers (CSP, X-Frame-Options, Referrer-Policy, etc.)
- Branch protection: data updates land via PR, not direct push to `main`

### Intelligence (rule-based, not an LLM)

Built in `src/utils/intelligence.js` from the JSON:

- **Daily Brief** — Natural-language summary of today’s figures
- **Situation Comparison** — Today vs yesterday deltas (↑/↓, improve/worsen colors)
- **Severity Ranking** — Top affected districts with progress bars
- **Trend Charts** — Population, camps, districts, river warnings over time
- **Situation Guidance** — Recommendations from thresholds (e.g. population high → camp capacity; river above danger → avoid riverside travel)
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

Contacts and safety tips are curated official helplines / guidance, not scraped flood-day numbers.

---

## How the data pipeline works

```
ASDMA DFR portal (PDF)
        │
        ▼
scripts/scrape_asdma_pdf.py
  • CSRF session + date walkback
  • download newest PDF
  • pdfplumber parse
  • write JSON under src/data/
        │
        ▼
Git commit on branch data/asdma-refresh
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
npm run scrape:pdf
```

### Why two update paths

| Path | Schedule | Reality |
| --- | --- | --- |
| **GitHub Actions** (`.github/workflows/scrape-asdma.yml`) | 09:00 & 16:00 IST + manual | Often fails: GitHub runners (US) cannot reliably reach `sdrf.assam.gov.in` |
| **Local Mac launchd** (`scripts/install_local_scheduler.sh`) | 09:00 & 16:00 local | Works: scrapes from an Indian IP, pushes `data/asdma-refresh`, opens a PR |

Primary production refresh: **local Mac scheduler**. GitHub Action remains as a fallback if ASDMA becomes reachable from Actions.

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
  pages/           # Route screens
  components/      # UI, map, intelligence, layout, SOS
  services/        # All data access (no hardcoded JSON in components)
  hooks/           # useFetch, useLocalStorage, useDarkMode
  utils/           # helpers + intelligence generators
  data/            # JSON datasets consumed by services
  assets/          # Hero photo, etc.
scripts/
  scrape_asdma_pdf.py
  local_refresh_asdma.sh
  install_local_scheduler.sh
.github/workflows/
  scrape-asdma.yml
```

**Design principle:** UI never imports JSON directly. Components call services → hooks → UI. That keeps a clean path to replace JSON with REST later.

---

## How the frontend was built

1. **Product shell** — Navbar, footer, dark mode, routing, SOS modal, checklist with localStorage.
2. **Service + JSON architecture** — Districts, camps, contacts, updates, weather, stats as files behind services.
3. **ASDMA ingestion** — Python PDF scraper replaces mock data with real daily reports; history snapshots enable comparisons and charts.
4. **Intelligence layer** — Rule-based summaries, rankings, recommendations, river cards.
5. **Map heat layer** — GeoJSON districts colored by severity; search + share.
6. **Production hardening**
   - Remove fake fields
   - Escape map tooltip HTML (XSS)
   - Error boundaries + mobile-friendly `ErrorState`
   - Lazy routes for Leaflet / Recharts
   - Security headers on Vercel / Netlify
   - Dependabot
   - Branch protection + data PRs only
7. **Deploy** — Vite build on Vercel; merge to `main` triggers redeploy.

---

## Hosting & release flow

1. Connect GitHub repo `suvamneog/flood` to Vercel (Vite preset, `npm run build`, output `dist`).
2. `vercel.json` provides SPA rewrites + CSP / frame / referrer headers.
3. Daily: Mac scheduler scrapes → opens data PR → you review figures → merge → Vercel rebuilds.

---

## Disclaimer (keep visible)

This platform is for **informational** purposes. Always follow official updates from:

- ASDMA
- District Administration
- IMD / CWC as applicable

Emergency numbers are public helplines; confirm locally if unsure.

---

## Quick commands

```bash
# App
npm install
npm run dev
npm run build

# Scrape latest ASDMA PDF into src/data/
npm run scrape:pdf

# Local twice-daily scheduler (Mac)
./scripts/install_local_scheduler.sh install
./scripts/install_local_scheduler.sh run-now
```

---

## Status summary

| Area | Status |
| --- | --- |
| Public UI | Production-ready on Vercel |
| Data accuracy | Real ASDMA PDF figures |
| Daily refresh | Local Mac scheduler + PR review |
| GitHub Actions scrape | Limited by ASDMA network block from runners |
| Backend / live API | Not required for v1; service layer ready |

FloodAssist Assam is a **presentation and preparedness layer** over official ASDMA daily reports — designed to be clear on a phone when water is rising.
