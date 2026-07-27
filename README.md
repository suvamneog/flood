# FloodAssist Assam

Public web app for Assam flood situational awareness — districts, map, relief camps, river alerts, emergency contacts, and preparedness tools.

Figures come from the official **ASDMA / SDRF Daily Flood Report** PDF. This is **not** an official government system of record.

**Live:** [floodassist-assam.vercel.app](https://floodassist-assam.vercel.app)

For architecture, accuracy rules, and pipeline detail, see [`overview.md`](./overview.md).

## Stack

- React 19 + Vite
- Tailwind CSS v4
- React Router
- Framer Motion + Lucide
- Leaflet / OpenStreetMap
- Recharts (lazy-loaded)
- Static JSON under `src/data/` (Axios ready if you add an API later)

## Getting started

```bash
npm install
npm run dev
```

```bash
npm run build    # production build → dist/
npm run preview  # preview production build
npm run lint
```

## Updating flood data (manual)

There is **no GitHub Actions scrape**. Refresh data yourself from a machine that can reach ASDMA (typically India), then open a PR — `main` is protected.

```bash
python3 -m pip install -r scripts/requirements.txt
npm run scrape:pdf                               # newest published PDF
python3 scripts/scrape_asdma_pdf.py --date 2026-07-26
python3 scripts/scrape_asdma_pdf.py --lookback 14
npm run scrape:pdf:seed                          # also archive ~5 earlier days
```

This writes:

- `src/data/districts.json`, `floodReports.json`, `reliefCamps.json`
- `src/data/stats.json`, `weather.json`, `updates.json`
- `src/data/history.json`, `meta.json`
- PDF cache under `scripts/raw/`

Then commit `src/data/*.json` on a branch (e.g. `data/asdma-refresh-YYYY-MM-DD`), open a PR, review the figures, and merge. Vercel redeploys from `main`.

Optional Mac helper (local only):

```bash
./scripts/install_local_scheduler.sh install
./scripts/install_local_scheduler.sh run-now
```

### What the PDF scraper extracts

Rivers above danger / flood level (CWC via ASDMA), per-district affected population, crop area, villages, revenue circles, relief camps + inmates, human lives lost.

**Accuracy notes:** severity badges are app-derived for UX; map pins are approximate district HQ; camps are district totals (not invented street addresses).

### Monthly DRIMS scrape (optional / legacy)

Cumulative monthly exports — not used for the daily live dashboard:

```bash
npm run scrape:asdma
DRIMS_PERIOD=2025_07 npm run scrape:asdma
DRIMS_TOKEN=your_token npm run scrape:asdma
```

## Past reports

Latest report is the default. Browse older days via **Past Reports** (`/timeline`) or the report-date filter on Flood Map, District Status, Relief Camps, and River & Impact Alerts (`?date=YYYY-MM-DD`).

## Deploy

Connected GitHub repo → Vercel (Vite, `npm run build`, output `dist`). Merges to `main` redeploy the site. `vercel.json` sets SPA rewrites and security headers.

## Disclaimer

Informational only. Always follow ASDMA, District Administration, IMD, and CWC. Emergency numbers are public helplines — confirm locally if unsure.
