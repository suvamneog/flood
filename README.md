# FloodAssist Assam

Public web app that helps people in Assam quickly check **flood situations**, relief camps, emergency contacts, official updates, and curated outbound donation links during monsoon season.

**Live:** [floodassist-assam.vercel.app](https://floodassist-assam.vercel.app)  
**Source data:** [ASDMA / SDRF Daily Flood Report](https://sdrf.assam.gov.in/dfr/)  
**Repo:** [github.com/suvamneog/flood](https://github.com/suvamneog/flood)

> **Unofficial.** FloodAssist is **not affiliated with ASDMA** and is not a government system of record. It presents figures from the official daily PDF in a clearer, mobile-friendly UI, with preparedness tools alongside the data.
>
> Figures are from the **latest official daily report** — not realtime gauges. Always follow ASDMA, District Administration, IMD, and CWC for decisions.

---

## Table of contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Pages & features](#pages--features)
- [Data: what’s real](#data-whats-real)
- [Data pipeline](#data-pipeline)
- [Updating flood data](#updating-flood-data)
- [Project layout](#project-layout)
- [Security](#security)
- [Hosting & release](#hosting--release)
- [Disclaimer](#disclaimer)
- [Further docs](#further-docs)

---

## What it does

Official Assam flood reports are dense PDFs. FloodAssist turns them into:

- Searchable district cards and a severity-colored map
- Statewide people / villages / camps / inmates totals
- Rivers above danger level (CWC via ASDMA)
- Day-over-day comparison, trend charts, and past-report browsing
- One-tap emergency calling and a prep checklist
- Outbound donate links only (no payments on this site)

**No backend.** The app ships static JSON under `src/data/` and is ready to swap services for live APIs later.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router |
| Motion | Framer Motion |
| Icons | Lucide React |
| Map | Leaflet + OpenStreetMap (`react-leaflet`) |
| Charts | Recharts (lazy-loaded) |
| Data access | Service modules over static JSON (no axios) |
| Hosting | Vercel (SPA + security headers) |
| Daily scrape | Python 3 + `pdfplumber` + `requests` |
| Optional scrape | Node DRIMS / CivicDataLab archive (`scripts/scrape-asdma.mjs`) |

---

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build → dist/
npm run preview      # preview the build
npm run lint         # oxlint
```

Node 20+ recommended. Python 3.11+ only needed for the PDF scraper.

---

## Pages & features

| Route | Page |
| --- | --- |
| `/` | Home — snapshot stats, daily brief, rankings, rivers, guidance, trends, donate CTA |
| `/flood-map` | Interactive map — district pins, heat layer, search, district drawer |
| `/districts` | District status cards (shareable `?district=`) |
| `/relief-camps` | District-level camp totals from ASDMA |
| `/emergency` | Flood-first helplines (1079, 1070, 108, 100, 101, 1077, …) |
| `/donate` | Outbound Assam flood campaigns only |
| `/updates` | Report-derived advisories |
| `/weather` | CWC river / impact alerts from the ASDMA PDF |
| `/checklist` | Interactive prep list (`localStorage`) |
| `/safety-tips` | Practical flood-safety cards |
| `/timeline` | Past Reports — every imported day; `?date=` reloads the dashboard |
| `/about` | Purpose and data disclaimer |

### Product extras

- Floating **SOS** (top flood helplines, one-tap call)
- Dark mode
- Data freshness banner (report date + sync time)
- Report-date filter on Home / Map / Districts / Camps / Weather
- Route-level code splitting (map + charts)
- Error boundaries and friendly empty / error states
- Mobile-first responsive UI

### Intelligence (rule-based — not an LLM)

Built in `src/utils/intelligence.js` from the JSON. Component names may include `Ai*` for historical reasons; there is **no** OpenAI / Anthropic / ChatGPT call.

- **Daily Brief** — short summary of the selected report
- **Situation Comparison** — today vs previous report deltas
- **Severity Ranking** — top affected districts
- **Trend Charts** — people, camps, districts, river warnings over history
- **Situation Guidance** — threshold-based recommendations
- **River Intelligence** — status / trend / affected districts

These refresh whenever new verified JSON is merged and the site redeploys.

---

## Data: what’s real

Flood figures come from the official ASDMA Daily Flood Report PDF:

- Affected population, villages, crop area
- Relief camps opened + camp inmates
- Human lives lost
- Revenue-circle detail where present
- Rivers above danger / highest flood level (CWC via ASDMA)

| UI content | Status |
| --- | --- |
| People, villages, camps, inmates, rivers | **Verified** against that day’s PDF totals |
| Past Reports / `history.json` | **Verified** when rebuilt from cached PDFs |
| Severity badges (Severe / Moderate / …) | **App-derived** for UX — not an ASDMA field |
| Daily Brief / guidance / rankings | **Rule-based** from the numbers |
| Contacts, checklist, safety tips | **Curated** public guidance |
| Donate links | **Outbound only** — spend is not verified |
| Map pin coordinates | District HQ approx. — not camp street GPS |

**Accuracy rules in production**

- No mock or guessed flood figures in live data files
- Camps are **district aggregates** (no invented street addresses)
- Google Maps links only when lat/lng are finite and inside an Assam / NE India buffer
- PDF “as on” date must match the day claimed — mismatched portal downloads are rejected

### Key JSON (`src/data/`)

| File | Role |
| --- | --- |
| `stats.json`, `districts.json`, `floodReports.json`, `reliefCamps.json` | Latest report dashboard |
| `weather.json`, `updates.json` | Rivers / impact + short advisories |
| `history.json` | Past-report snapshots (timeline + trends) |
| `meta.json` | Report date, scrape time, source notes |
| `contacts.json`, `checklist.json`, `safetyTips.json` | Preparedness content |
| `donations.json` | Outbound donate channels + disclaimer |
| `assamDistricts.geo.json` | Map polygons |

---

## Data pipeline

```
ASDMA DFR portal (PDF)
        │
        ▼
scripts/scrape_asdma_pdf.py
  • CSRF session + optional date walkback
  • reject PDF if “as on” date ≠ requested day
  • pdfplumber parse → write src/data/*.json
        │
        ▼
Branch data/asdma-refresh-YYYY-MM-DD → PR → review → merge main
        │
        ▼
Vercel redeploy → public site updates
```

### Scrapers

**Daily PDF (primary)** — `scripts/scrape_asdma_pdf.py`

```bash
python3 -m pip install -r scripts/requirements.txt
npm run scrape:pdf                                    # newest available
python3 scripts/scrape_asdma_pdf.py --date 2026-08-05
python3 scripts/scrape_asdma_pdf.py --lookback 0      # exact day only
```

Cached PDFs land in `scripts/raw/` (gitignored).

**Monthly DRIMS (optional)** — `scripts/scrape-asdma.mjs`

```bash
npm run scrape:asdma                                  # CivicDataLab archive
DRIMS_PERIOD=2025_07 npm run scrape:asdma
DRIMS_TOKEN=your_token npm run scrape:asdma           # live API (never commit the token)
```

Live DRIMS at `drims.veldev.com` needs login. Without `DRIMS_TOKEN`, the Node scraper uses the open CivicDataLab ASDMA DRIMS archive.

### Refresh paths

| Path | When | Notes |
| --- | --- | --- |
| **Manual scrape + PR** | Primary | Review figures before merge |
| **Mac local scheduler** | Optional | `./scripts/install_local_scheduler.sh` |
| **GitHub Actions** | `workflow_dispatch` only | Daily cron **disabled** — ASDMA is unreliable from runners |

---

## Updating flood data

Full runbook: [`DATA_UPDATE.md`](./DATA_UPDATE.md).

```bash
git fetch origin main
git checkout -B data/asdma-refresh-YYYY-MM-DD origin/main
python3 scripts/scrape_asdma_pdf.py --date YYYY-MM-DD
# Verify people / villages / camps / inmates vs PDF totals
git add src/data
git commit -m "chore: refresh ASDMA flood data (YYYY-MM-DD)"
git push -u origin HEAD
# Open PR → review → merge
```

If the scraper reports a wrong PDF date or the portal is not publishing yet — **stop**. Keep live data on the last verified day.

---

## Project layout

```
src/
  pages/           # Route screens
  components/      # UI, map, intelligence, layout, SOS
  services/        # JSON access helpers
  hooks/           # useFetch, useLocalStorage, useDarkMode
  utils/           # helpers + intelligence generators
  data/            # Static datasets shipped with the app
  assets/          # Hero imagery
scripts/
  scrape_asdma_pdf.py          # Daily ASDMA PDF scraper
  scrape-asdma.mjs             # Optional DRIMS path
  local_refresh_asdma.sh
  install_local_scheduler.sh
  requirements.txt
.github/workflows/
  scrape-asdma.yml             # Manual dispatch only
vercel.json                    # SPA rewrites + security headers
DATA_UPDATE.md                 # Daily data refresh runbook
overview.md                    # Extended product notes
```

Screens call **services → hooks → UI**. Donate reads curated `donations.json` with an HTTPS host allowlist.

---

## Security

- CSP, HSTS, `X-Frame-Options`, `nosniff`, Referrer-Policy, Permissions-Policy (`vercel.json` + `public/_headers`)
- Donate URLs: HTTPS only + allowlisted hosts
- Safe `tel:` helper; maps URLs validated for Assam / NE bounds
- `.env` / `.env.*` gitignored — never commit `DRIMS_TOKEN` or GitHub tokens
- No payment processing; donate buttons open third-party sites only
- Branch protection: data updates via PR, not direct push to `main`

Do not hammer the ASDMA portal. Prefer one scrape per day after the report is published.

---

## Hosting & release

1. GitHub repo → Vercel (Vite preset, `npm run build`, output `dist/`)
2. Merge to `main` triggers redeploy
3. Data: scrape → PR → review totals → merge → site updates

---

## Disclaimer

This platform is for **informational** purposes. Always follow official updates from ASDMA, District Administration, and IMD / CWC as applicable.

Emergency numbers are public helplines; confirm locally if unsure.

**Donate:** FloodAssist does not collect money, endorse campaigns, or verify how funds are spent.

**Copy guidance:** Prefer “same-day official ASDMA figures.” Avoid “realtime,” “ASDMA verified us,” or “we verify donations.”

---

## Further docs

| Doc | Contents |
| --- | --- |
| [`DATA_UPDATE.md`](./DATA_UPDATE.md) | Daily ASDMA refresh + accuracy checklist |
| [`overview.md`](./overview.md) | Longer product / architecture notes |

---

## Quick commands

```bash
# App
npm install && npm run dev

# Latest ASDMA PDF → src/data/
npm run scrape:pdf

# Exact day
python3 scripts/scrape_asdma_pdf.py --date YYYY-MM-DD

# Mac scheduler helpers
./scripts/install_local_scheduler.sh install
./scripts/install_local_scheduler.sh run-now
./scripts/install_local_scheduler.sh status
```

FloodAssist Assam is a **presentation and preparedness layer** over official ASDMA daily reports — built to be clear on a phone when water is rising.
