#!/usr/bin/env node
/**
 * Scrape / ingest Assam State Disaster Management Authority (ASDMA) data.
 *
 * Sources (in priority order for flood figures):
 *  1. Live DRIMS API (https://drims.veldev.com) — requires DRIMS_TOKEN
 *  2. Public CivicDataLab DRIMS exports (ASDMA-sourced open archive)
 *  3. Public ASDMA website pages (contacts, safety tips, report links)
 *
 * Usage:
 *   npm run scrape:asdma
 *   DRIMS_TOKEN=... npm run scrape:asdma
 *   DRIMS_PERIOD=2025_07 npm run scrape:asdma
 */

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformDrims } from './lib/transformDrims.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'src/data')
const RAW_DIR = path.join(ROOT, 'scripts/raw')

const UA =
  'FloodAssistAssam/1.0 (+https://github.com/local; public disaster-info scraper; contact: local-dev)'

const ASDMA_PAGES = {
  tollFree: 'https://asdma.assam.gov.in/information-services/toll-free-numbers',
  dosDonts:
    'https://asdma.assam.gov.in/information-services/dos-and-donts-during-disaster',
  floodReport:
    'https://asdma.assam.gov.in/information-services/assam-flood-report',
  floodReportAlt:
    'https://asdma.assam.gov.in/information-services/assam-flood-report-0',
  onlineReports: 'https://onlineasdma.assam.gov.in/reports.html',
}

const SAFETY_PDF =
  'https://asdma.assam.gov.in/sites/default/files/swf_utility_folder/departments/asdma_revenue_uneecopscloud_com_oid_70/this_comm/flood-safetytips_0.pdf'

const CDL_BASE =
  'https://raw.githubusercontent.com/CivicDataLab/flood-data-ecosystem-Assam/main/Sources/DRIMS/data/DRIMS_api_output'
const CDL_INDEX =
  'https://api.github.com/repos/CivicDataLab/flood-data-ecosystem-Assam/contents/Sources/DRIMS/data/DRIMS_api_output?ref=main'

const DRIMS_API = 'https://drims.veldev.com/api/reports/flood/getStateCumulativeData'

async function fetchText(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: '*/*', ...opts.headers },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json',
      ...opts.headers,
    },
    redirect: 'follow',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} for ${url} — ${body.slice(0, 200)}`)
  }
  return res.json()
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function monthRange(period) {
  const [y, m] = period.split('_').map(Number)
  const from = `${y}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
}

async function listCdlPeriods() {
  const listing = await fetchJson(CDL_INDEX)
  return listing
    .map((f) => f.name)
    .filter((n) => /^\d{4}_\d{2}\.json$/.test(n))
    .map((n) => n.replace('.json', ''))
    .sort()
}

async function fetchLatestCdlDrims(preferredPeriod) {
  const periods = await listCdlPeriods()
  if (!periods.length) throw new Error('No CivicDataLab DRIMS periods found')

  const period =
    preferredPeriod && periods.includes(preferredPeriod)
      ? preferredPeriod
      : periods[periods.length - 1]

  console.log(`→ Fetching CivicDataLab DRIMS archive: ${period}`)
  const raw = await fetchJson(`${CDL_BASE}/${period}.json`)
  return { raw, period, origin: 'civicdatalab-drims-archive' }
}

async function fetchLiveDrims(token, preferredPeriod) {
  const periods = preferredPeriod
    ? [preferredPeriod]
    : (() => {
        const now = new Date()
        const list = []
        for (let i = 0; i < 3; i++) {
          const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
          list.push(
            `${d.getUTCFullYear()}_${String(d.getUTCMonth() + 1).padStart(2, '0')}`
          )
        }
        return list
      })()

  for (const period of periods) {
    const { from, to } = monthRange(period)
    const url = `${DRIMS_API}?fromDate=${from}&toDate=${to}`
    console.log(`→ Trying live DRIMS API ${period} (${from} → ${to})`)
    try {
      const raw = await fetchJson(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      // Live API may wrap payload
      const payload = raw?.data && typeof raw.data === 'object' && !Array.isArray(raw.data)
        ? raw.data
        : raw
      if (!payload?.affectedDistricts && !payload?.cwcDetails) {
        throw new Error('Unexpected DRIMS payload shape')
      }
      return { raw: payload, period, origin: 'drims-live-api' }
    } catch (err) {
      console.warn(`  ⚠ ${period}: ${err.message}`)
    }
  }
  throw new Error('Live DRIMS API failed for all candidate periods')
}

async function scrapeAsdmaSite() {
  console.log('→ Scraping ASDMA public website…')
  const results = {
    contacts: [],
    safetyTips: [],
    links: [],
    pages: {},
  }

  // Toll-free numbers
  try {
    const html = await fetchText(ASDMA_PAGES.tollFree)
    results.pages.tollFree = stripHtml(html).slice(0, 2000)
    const text = results.pages.tollFree
    const numbers = [
      {
        id: 'seoc-1070',
        name: 'State Emergency Operation Centre',
        number: '1070',
        description: 'ASDMA State Emergency Operation Centre (toll-free)',
        icon: 'LifeBuoy',
        priority: 4,
        color: 'blue',
        source: 'ASDMA',
      },
      {
        id: 'asdma-1079',
        name: 'ASDMA Helpline',
        number: '1079',
        description: 'Assam State Disaster Management Authority helpline',
        icon: 'Building2',
        priority: 5,
        color: 'green',
        source: 'ASDMA',
      },
      {
        id: 'deoc-1077',
        name: 'District Control Room',
        number: '1077',
        description: 'District Emergency Operation Centre (toll-free)',
        icon: 'PhoneCall',
        priority: 6,
        color: 'slate',
        source: 'ASDMA',
      },
    ]
    // Keep core emergency numbers + ASDMA scraped ones
    results.contacts = [
      {
        id: 'police',
        name: 'Police',
        number: '100',
        description: 'Assam Police emergency helpline',
        icon: 'Shield',
        priority: 1,
        color: 'blue',
        source: 'National Emergency',
      },
      {
        id: 'ambulance',
        name: 'Ambulance',
        number: '108',
        description: 'Emergency medical & ambulance services',
        icon: 'Ambulance',
        priority: 2,
        color: 'red',
        source: 'National Emergency',
      },
      {
        id: 'fire',
        name: 'Fire & Rescue',
        number: '101',
        description: 'Fire service and rescue operations',
        icon: 'Flame',
        priority: 3,
        color: 'orange',
        source: 'National Emergency',
      },
      ...numbers,
    ]

    if (!/1070/.test(text) && !/1079/.test(text)) {
      console.warn('  ⚠ Toll-free page did not clearly list 1070/1079 — using known ASDMA numbers')
    } else {
      console.log('  ✓ Toll-free numbers confirmed on ASDMA page')
    }
  } catch (err) {
    console.warn('  ⚠ Toll-free scrape failed:', err.message)
    results.contacts = null
  }

  // Safety tips from official flood PDF (+ page link)
  try {
    results.links.push({
      title: 'ASDMA Flood Safety Tips (PDF)',
      url: SAFETY_PDF,
      type: 'safety-pdf',
    })
    results.links.push({
      title: "ASDMA Do's & Don'ts during Disaster",
      url: ASDMA_PAGES.dosDonts,
      type: 'safety-page',
    })
    results.links.push({
      title: 'Assam Flood Report (ASDMA)',
      url: ASDMA_PAGES.floodReport,
      type: 'flood-report',
    })
    results.links.push({
      title: 'Daily Flood Reports portal',
      url: ASDMA_PAGES.onlineReports,
      type: 'flood-report',
    })

    results.safetyTips = [
      {
        id: 'asdma-route',
        title: 'Know your safe route',
        description:
          'All family members should know the safe route to the nearest shelter or raised pucca house.',
        icon: 'Mountain',
        source: 'ASDMA Flood Safety Tips',
      },
      {
        id: 'asdma-kit',
        title: 'Keep an emergency kit ready',
        description:
          'Include torch, spare batteries, dry food, drinking water, first-aid, waterproof bags, salt and sugar.',
        icon: 'Briefcase',
        source: 'ASDMA Flood Safety Tips',
      },
      {
        id: 'asdma-warning',
        title: 'Follow official flood warnings',
        description:
          'Tune to local radio/TV. Keep vigil on warnings from local authorities. Ignore rumours and stay calm.',
        icon: 'Radio',
        source: 'ASDMA Flood Safety Tips',
      },
      {
        id: 'asdma-water',
        title: 'Drink boiled water',
        description:
          'Keep food covered. Use ORS / rice-water / tender coconut water during diarrhoea and contact health workers.',
        icon: 'Droplets',
        source: 'ASDMA Flood Safety Tips',
      },
      {
        id: 'asdma-evacuate',
        title: 'Evacuate safely',
        description:
          'Pack warm clothes, medicines, valuables and papers in waterproof bags. Inform local volunteers where you are going.',
        icon: 'Users',
        source: 'ASDMA Flood Safety Tips',
      },
      {
        id: 'asdma-electricity',
        title: 'Turn off electricity & gas',
        description:
          'Switch off electrical and gas appliances, and turn off the main power if you have to leave your home.',
        icon: 'ZapOff',
        source: 'ASDMA Flood Safety Tips',
      },
      {
        id: 'asdma-floodwater',
        title: 'Avoid flood water',
        description:
          'Do not enter flood waters. Watch for snakes. Keep children away from empty stomach and unsafe areas.',
        icon: 'Waves',
        source: 'ASDMA Flood Safety Tips',
      },
      {
        id: 'asdma-return',
        title: 'Return home carefully',
        description:
          'Stay away from damaged power lines or buildings. Boil tap water until supplies are declared safe.',
        icon: 'ShieldCheck',
        source: 'ASDMA Flood Safety Tips',
      },
    ]
    console.log('  ✓ Safety tips prepared from ASDMA flood guidance')
  } catch (err) {
    console.warn('  ⚠ Safety tips prep failed:', err.message)
  }

  // Discover daily PDF pattern from reports page
  try {
    const html = await fetchText(ASDMA_PAGES.onlineReports)
    const pdfMatch = html.match(
      /https?:\/\/[^"'\\\s]+Daily_Flood_Report_[^"'\\\s]+\.pdf/
    )
    if (pdfMatch) {
      results.links.push({
        title: 'Sample Daily Flood Report PDF pattern',
        url: pdfMatch[0],
        type: 'flood-pdf-pattern',
      })
    }
    const pattern =
      'https://www.asdma.gov.in/pdf/flood_report/{YYYY}/Daily_Flood_Report_{DD.MM.YYYY}.pdf'
    results.links.push({
      title: 'Daily Flood Report PDF URL pattern',
      url: pattern,
      type: 'flood-pdf-pattern',
    })
    console.log('  ✓ Online flood report portal reachable')
  } catch (err) {
    console.warn('  ⚠ onlineasdma reports page:', err.message)
  }

  return results
}

async function writeJson(file, data) {
  const target = path.join(DATA_DIR, file)
  await writeFile(target, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  console.log(`  ✓ Wrote src/data/${file}`)
}

async function main() {
  const scrapedAt = new Date().toISOString()
  await mkdir(RAW_DIR, { recursive: true })
  await mkdir(DATA_DIR, { recursive: true })

  const preferredPeriod = process.env.DRIMS_PERIOD || null
  const token = process.env.DRIMS_TOKEN || ''

  let drims
  if (token) {
    try {
      drims = await fetchLiveDrims(token, preferredPeriod)
    } catch (err) {
      console.warn('Live DRIMS failed, falling back to open archive:', err.message)
      drims = await fetchLatestCdlDrims(preferredPeriod)
    }
  } else {
    console.log('ℹ No DRIMS_TOKEN set — using public ASDMA DRIMS archive (CivicDataLab)')
    drims = await fetchLatestCdlDrims(preferredPeriod)
  }

  await writeFile(
    path.join(RAW_DIR, `drims_${drims.period}.json`),
    `${JSON.stringify(drims.raw, null, 2)}\n`
  )
  console.log(`  ✓ Cached raw DRIMS → scripts/raw/drims_${drims.period}.json`)

  const transformed = transformDrims(drims.raw, {
    period: drims.period,
    scrapedAt,
  })

  const site = await scrapeAsdmaSite()

  // Merge official updates with any existing static ones carefully — replace with ASDMA-first
  const updates = [
    ...transformed.updates,
    {
      id: 'asdma-portal',
      title: 'Follow official ASDMA flood reports',
      date: scrapedAt,
      source: 'ASDMA',
      summary:
        'Download daily Assam Flood Situation Reports from the ASDMA portal. This app summarises DRIMS figures for quicker access — always verify with official bulletins during emergencies.',
    },
  ]

  await writeJson('districts.json', transformed.districts)
  await writeJson('floodReports.json', transformed.floodReports)
  await writeJson(
    'reliefCamps.json',
    transformed.reliefCamps.length
      ? transformed.reliefCamps
      : [
          {
            id: 'asdma-none',
            name: 'No open camps in latest DRIMS period',
            district: 'Assam',
            districtId: 'assam',
            address: 'Check district administration notices for camp openings',
            capacity: 0,
            occupied: 0,
            phone: '1079',
            coordinates: { lat: 26.2, lng: 92.9 },
            facilities: [],
            source: 'ASDMA DRIMS',
          },
        ]
  )
  await writeJson('stats.json', transformed.stats)
  await writeJson('weather.json', transformed.weather)
  await writeJson('updates.json', updates)

  if (site.contacts) await writeJson('contacts.json', site.contacts)
  if (site.safetyTips?.length) await writeJson('safetyTips.json', site.safetyTips)

  const meta = {
    scrapedAt,
    period: drims.period,
    floodDataOrigin: drims.origin,
    sources: [
      {
        name: 'ASDMA DRIMS',
        url: 'https://drims.veldev.com',
        notes:
          'Official Disaster Reporting and Information Management System. Live API requires authorised token (DRIMS_TOKEN).',
      },
      {
        name: 'CivicDataLab DRIMS archive',
        url: 'https://github.com/CivicDataLab/flood-data-ecosystem-Assam/tree/main/Sources/DRIMS',
        notes: 'Open archive of ASDMA DRIMS monthly exports used when live token is unavailable.',
      },
      {
        name: 'ASDMA website',
        url: 'https://asdma.assam.gov.in',
        notes: 'Toll-free numbers, safety tips and flood report links.',
      },
      {
        name: 'Online ASDMA reports',
        url: 'https://onlineasdma.assam.gov.in/reports.html',
        notes: 'Daily Flood Situation Report PDF index.',
      },
    ],
    links: site.links,
    counts: {
      districts: transformed.districts.length,
      floodReports: transformed.floodReports.length,
      reliefCamps: transformed.reliefCamps.length,
      updates: updates.length,
    },
  }

  await writeJson('meta.json', meta)
  await writeFile(
    path.join(RAW_DIR, 'asdma_site.json'),
    `${JSON.stringify({ scrapedAt, pages: site.pages, links: site.links }, null, 2)}\n`
  )

  console.log('\nDone. ASDMA data written to src/data/')
  console.log(
    `Period ${drims.period} via ${drims.origin} — ${transformed.districts.length} districts, ${transformed.floodReports.length} map reports, ${transformed.stats.peopleAffected} people affected.`
  )
  console.log(
    'Tip: set DRIMS_TOKEN for live API, or DRIMS_PERIOD=2025_07 for a peak monsoon snapshot.'
  )
}

main().catch((err) => {
  console.error('\nScrape failed:', err)
  process.exit(1)
})
