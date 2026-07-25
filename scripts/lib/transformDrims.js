import { coordsFor, slugifyDistrict } from './districtCoords.js'

function parseIntSafe(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function countVillages(details = '') {
  if (!details) return 0
  // Patterns like "(Rongjuli | 3)" or multiple circle segments
  const matches = [...details.matchAll(/\|\s*(\d+)/g)]
  if (matches.length) {
    return matches.reduce((sum, m) => sum + parseIntSafe(m[1]), 0)
  }
  return details.split('),').filter(Boolean).length
}

function parsePopulationDetails(details = '') {
  const villages = []
  const re =
    /\(([^|]+)\|\s*Population Affected:\s*([\d.]+)\s*\|\s*Crop Area[^:]*:\s*([\d.]+)\)/gi
  let m
  while ((m = re.exec(details))) {
    villages.push({
      circle: m[1].trim(),
      population: parseIntSafe(m[2]),
      cropArea: parseFloat(m[3]) || 0,
    })
  }
  return villages
}

function severityFor({ population, camps, cropArea, isListedAffected }) {
  if (population >= 10000 || camps >= 8) return 'severe'
  if (population >= 1000 || camps >= 1) return 'moderate'
  if (population > 0 || cropArea > 0 || isListedAffected) return 'waterlogging'
  return 'normal'
}

function floodStatusFor(severity) {
  if (severity === 'severe') return 'flooded'
  if (severity === 'moderate' || severity === 'waterlogging') return 'waterlogging'
  return 'safe'
}

function riverHint(cwc = {}, district) {
  const all = [
    cwc.riversAtFloodLevel,
    cwc.riversAtDangerLevel,
    cwc.riversAtWarningLevel,
  ]
    .filter(Boolean)
    .join(', ')
  if (!all) return 'Brahmaputra / local rivers'
  const parts = all.split(',').map((s) => s.trim())
  const hit = parts.find((p) =>
    p.toLowerCase().includes(district.toLowerCase().slice(0, 4))
  )
  if (hit) return hit.replace(/\([^)]*\)/g, '').trim()
  const first = parts[0] || 'Local rivers'
  return first.replace(/\([^)]*\)/g, '').trim() || 'Local rivers'
}

function periodEndIso(period) {
  // period like "2025_07" or "2026_05"
  const [y, m] = period.split('_').map(Number)
  const last = new Date(Date.UTC(y, m, 0, 12, 0, 0))
  return last.toISOString()
}

/**
 * Transform ASDMA DRIMS state cumulative payload into FloodAssist datasets.
 */
export function transformDrims(raw, { period, scrapedAt }) {
  const lastUpdated = periodEndIso(period)
  const cwc = raw.cwcDetails || {}
  const affectedNames = new Set(
    String(raw.affectedDistricts?.districts || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  )

  const popByDistrict = new Map()
  for (const row of raw.affectedPopulation || []) {
    popByDistrict.set(row.district, row)
  }

  const campByDistrict = new Map()
  for (const row of raw.reliefCampsAndCenters || []) {
    campByDistrict.set(row.district, row)
  }

  const inmateByDistrict = new Map()
  for (const row of raw.campInmates || []) {
    inmateByDistrict.set(row.district, row)
  }

  const villageByDistrict = new Map()
  for (const row of raw.affectedVillages || []) {
    villageByDistrict.set(row.district, row)
  }

  const districtNames = new Set([
    ...affectedNames,
    ...popByDistrict.keys(),
    ...campByDistrict.keys(),
  ])

  const districts = [...districtNames]
    .filter(Boolean)
    .map((name) => {
      const pop = popByDistrict.get(name) || {}
      const camp = campByDistrict.get(name) || {}
      const village = villageByDistrict.get(name) || {}
      const population = parseIntSafe(pop.total)
      const camps = parseIntSafe(camp.totalReliefCamp)
      const cropArea = parseIntSafe(pop.totalCropArea)
      const affectedVillages =
        parseIntSafe(village.total) || countVillages(village.details) || 0
      const isListedAffected = affectedNames.has(name)
      const severity = severityFor({
        population,
        camps,
        cropArea,
        isListedAffected,
      })

      return {
        id: slugifyDistrict(name),
        name,
        severity,
        affectedVillages,
        river: riverHint(cwc, name),
        waterLevel:
          severity === 'severe'
            ? 'critical'
            : severity === 'normal'
              ? 'normal'
              : 'elevated',
        populationAffected: population,
        reliefCamps: camps,
        cropAreaHa: cropArea,
        lastUpdated,
        coordinates: coordsFor(name),
        source: 'ASDMA DRIMS',
      }
    })
    .sort((a, b) => b.populationAffected - a.populationAffected)

  const floodReports = []
  for (const d of districts) {
    if (d.severity === 'normal' && d.populationAffected === 0) continue
    const pop = popByDistrict.get(d.name) || {}
    const circles = parsePopulationDetails(pop.details || '')
    const status = floodStatusFor(d.severity)

    if (circles.length) {
      circles.forEach((c, i) => {
        if (c.population <= 0 && c.cropArea <= 0) return
        floodReports.push({
          id: `asdma-${d.id}-${i + 1}`,
          district: d.name,
          districtId: d.id,
          location: c.circle,
          status: c.population >= 3000 ? 'flooded' : status,
          waterLevel:
            c.population >= 3000
              ? 'Above danger (reported)'
              : c.cropArea > 0
                ? 'Crop areas submerged'
                : 'Elevated / waterlogging',
          description: `ASDMA DRIMS: ${c.population.toLocaleString('en-IN')} people affected in ${c.circle} revenue circle${
            c.cropArea ? `; ${c.cropArea} ha crop area submerged` : ''
          }.`,
          lastUpdated,
          photo: null,
          coordinates: {
            lat: d.coordinates.lat + (i - circles.length / 2) * 0.04,
            lng: d.coordinates.lng + (i % 2 === 0 ? 0.03 : -0.03),
          },
          source: 'ASDMA DRIMS',
        })
      })
    } else {
      floodReports.push({
        id: `asdma-${d.id}`,
        district: d.name,
        districtId: d.id,
        location: `${d.name} district`,
        status,
        waterLevel:
          d.severity === 'severe' ? 'Critical (DRIMS)' : 'Elevated (DRIMS)',
        description: `ASDMA DRIMS report for ${d.name}: ${d.populationAffected.toLocaleString('en-IN')} people affected, ${d.affectedVillages} village/circle entries, ${d.reliefCamps} relief camps.`,
        lastUpdated,
        photo: null,
        coordinates: d.coordinates,
        source: 'ASDMA DRIMS',
      })
    }
  }

  const reliefCamps = districts
    .filter((d) => d.reliefCamps > 0)
    .map((d) => {
      const inmates = parseIntSafe(inmateByDistrict.get(d.name)?.total)
      const capacity = Math.max(inmates, d.reliefCamps * 80)
      return {
        id: `asdma-camp-${d.id}`,
        name: `${d.name} Relief Camps (ASDMA aggregate)`,
        district: d.name,
        districtId: d.id,
        address: `${d.name} district — ${d.reliefCamps} camp(s) reported in ASDMA DRIMS`,
        capacity,
        occupied: inmates,
        phone: '1077',
        coordinates: d.coordinates,
        facilities: ['Food', 'Drinking Water', 'Medical'],
        source: 'ASDMA DRIMS',
        note: 'Individual camp addresses are published by district administrations. Figures are district totals from ASDMA DRIMS.',
      }
    })

  const totalPop = districts.reduce((s, d) => s + d.populationAffected, 0)
  const totalCamps = districts.reduce((s, d) => s + d.reliefCamps, 0)
  const floodedDistricts = districts.filter((d) => d.severity !== 'normal').length

  const stats = {
    floodedDistricts,
    reliefCamps: totalCamps,
    emergencyNumbers: 6,
    lastUpdated: scrapedAt,
    peopleAffected: totalPop,
    activeAlerts:
      [cwc.riversAtFloodLevel, cwc.riversAtDangerLevel, cwc.riversAtWarningLevel].filter(
        Boolean
      ).length,
    source: 'ASDMA DRIMS',
    period,
  }

  const weather = [
    {
      id: 'asdma-cwc-danger',
      type: 'river-level',
      title: 'Rivers at Danger Level',
      level: cwc.riversAtDangerLevel ? 'red' : 'green',
      value: cwc.riversAtDangerLevel ? 'Above danger' : 'None reported',
      unit: 'CWC via ASDMA DRIMS',
      description:
        cwc.riversAtDangerLevel ||
        'No rivers currently reported at danger level in this DRIMS period.',
      validUntil: lastUpdated,
      source: 'ASDMA DRIMS / CWC',
    },
    {
      id: 'asdma-cwc-warning',
      type: 'river-level',
      title: 'Rivers at Warning Level',
      level: cwc.riversAtWarningLevel ? 'orange' : 'green',
      value: cwc.riversAtWarningLevel ? 'Warning' : 'None reported',
      unit: 'CWC via ASDMA DRIMS',
      description:
        cwc.riversAtWarningLevel ||
        'No rivers currently reported at warning level in this DRIMS period.',
      validUntil: lastUpdated,
      source: 'ASDMA DRIMS / CWC',
    },
    {
      id: 'asdma-cwc-flood',
      type: 'heavy-rain',
      title: 'Rivers at Flood Level',
      level: cwc.riversAtFloodLevel ? 'red' : 'green',
      value: cwc.riversAtFloodLevel ? 'Flood stage' : 'None reported',
      unit: 'CWC via ASDMA DRIMS',
      description:
        cwc.riversAtFloodLevel ||
        'No rivers currently reported at flood level in this DRIMS period.',
      validUntil: lastUpdated,
      source: 'ASDMA DRIMS / CWC',
    },
    {
      id: 'asdma-impact',
      type: 'forecast',
      title: 'Flood Impact Snapshot',
      level: floodedDistricts >= 5 ? 'orange' : 'warning',
      value: `${floodedDistricts} districts`,
      unit: `${totalPop.toLocaleString('en-IN')} people affected`,
      description: `ASDMA DRIMS period ${period.replace('_', '-')}: ${totalCamps} relief camps open across affected districts.`,
      validUntil: lastUpdated,
      source: 'ASDMA DRIMS',
    },
  ]

  const updates = [
    {
      id: `asdma-update-${period}`,
      title: `ASDMA flood situation — ${period.replace('_', '/')}`,
      date: lastUpdated,
      source: 'ASDMA DRIMS',
      summary: `${floodedDistricts} districts reported flood impact with ${totalPop.toLocaleString('en-IN')} people affected and ${totalCamps} relief camps. Affected: ${
        raw.affectedDistricts?.districts || 'see district status'
      }.`,
    },
  ]

  if (cwc.riversAtDangerLevel) {
    updates.push({
      id: `asdma-cwc-danger-${period}`,
      title: 'CWC: rivers flowing above danger level',
      date: lastUpdated,
      source: 'CWC via ASDMA',
      summary: cwc.riversAtDangerLevel,
    })
  }
  if (cwc.riversAtWarningLevel) {
    updates.push({
      id: `asdma-cwc-warn-${period}`,
      title: 'CWC: rivers at warning level',
      date: lastUpdated,
      source: 'CWC via ASDMA',
      summary: cwc.riversAtWarningLevel,
    })
  }

  return {
    districts,
    floodReports,
    reliefCamps,
    stats,
    weather,
    updates,
  }
}
