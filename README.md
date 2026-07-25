# FloodAssist Assam

A modern, production-quality web app to help people in Assam quickly check flood situations, relief camps, emergency contacts and official updates.

## Stack

- React + Vite
- Tailwind CSS v4
- React Router
- Framer Motion
- Lucide React
- Leaflet + OpenStreetMap
- Axios (service layer ready for APIs)

## Getting started

```bash
npm install
npm run dev
```

## ASDMA data scrape

Flood figures are ingested from **ASDMA / SDRF**'s official Daily Flood Report at [sdrf.assam.gov.in/dfr](https://sdrf.assam.gov.in/dfr/). Two scrapers are available.

### Daily PDF (recommended — latest today's report)

`scripts/scrape_asdma_pdf.py` walks back from today until it finds the newest published PDF, downloads it, parses every district table with `pdfplumber`, and writes the React data files.

```bash
python3 -m pip install -r scripts/requirements.txt
npm run scrape:pdf                               # newest available
python3 scripts/scrape_asdma_pdf.py --date 2026-07-24
python3 scripts/scrape_asdma_pdf.py --lookback 14
```

Extracts: rivers above danger / flood level (CWC), per-district affected population, crop area, villages, revenue circles, relief camps opened, camp inmates, human lives lost, plus revenue-circle level details for the map.

### Monthly DRIMS API (Node — cumulative periods)

```bash
npm run scrape:asdma                            # latest public DRIMS month
DRIMS_PERIOD=2025_07 npm run scrape:asdma
DRIMS_TOKEN=your_token npm run scrape:asdma     # live API
```

Writes:

- `src/data/districts.json`, `floodReports.json`, `reliefCamps.json`, `stats.json`, `weather.json`, `updates.json`
- `src/data/contacts.json`, `safetyTips.json` (from [asdma.assam.gov.in](https://asdma.assam.gov.in))
- `src/data/meta.json` (scrape metadata)
- `scripts/raw/` (cached raw payloads)

> Live DRIMS at `drims.veldev.com` requires login. Without `DRIMS_TOKEN`, the scraper uses the open CivicDataLab archive of ASDMA DRIMS exports.
