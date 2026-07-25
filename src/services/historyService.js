import history from '../data/history.json'
import districts from '../data/districts.json'
import stats from '../data/stats.json'
import weather from '../data/weather.json'
import meta from '../data/meta.json'

export const getHistory = async () => ({
  reports: [...(history.reports || [])].sort((a, b) =>
    b.date.localeCompare(a.date)
  ),
  updatedAt: history.updatedAt,
})

/** Previous report relative to a given date (default: latest live report). */
export const getPreviousReport = async (relativeToDate) => {
  const { reports } = await getHistory()
  const anchor = relativeToDate || meta.reportDate || stats.reportDate || stats.period
  const older = reports.filter((r) => r.date < anchor)
  return older[0] || null
}

export const getReportByDate = async (date) => {
  const { reports } = await getHistory()
  return reports.find((r) => r.date === date) || null
}

/**
 * Dashboard payload for a selected date.
 * Live (latest meta.reportDate) uses current JSON files;
 * historical dates use history snapshots.
 */
export const getDashboardForDate = async (date) => {
  const liveDate = meta.reportDate || stats.reportDate || stats.period

  if (!date || date === liveDate) {
    return {
      isLive: true,
      date: liveDate,
      districts: [...districts],
      stats: { ...stats },
      weather: [...weather],
      meta: { ...meta },
    }
  }

  const snap = (history.reports || []).find((r) => r.date === date)
  if (!snap) return null

  return {
    isLive: false,
    date: snap.date,
    districts: snap.districts || [],
    stats: {
      ...snap.stats,
      peopleAffected: snap.stats.peopleAffected,
      floodedDistricts: snap.stats.floodedDistricts,
      reliefCamps: snap.stats.reliefCamps,
      campInmates: snap.stats.campInmates,
      activeAlerts: snap.stats.riverWarnings ?? snap.stats.activeAlerts,
      lastUpdated: `${snap.date}T08:00:00Z`,
      reportDate: snap.date,
      period: snap.date,
      source: 'ASDMA Daily Flood Report (historical snapshot)',
    },
    weather: [
      {
        id: 'asdma-cwc-danger',
        type: 'river-level',
        title: 'Rivers Above Danger Level',
        level: (snap.rivers?.danger || []).length ? 'red' : 'green',
        value: (snap.rivers?.danger || []).length
          ? `${snap.rivers.danger.length} rivers`
          : 'None',
        unit: 'CWC bulletin · 8 AM (via ASDMA)',
        description:
          (snap.rivers?.danger || []).join(', ') ||
          'No rivers above danger level.',
        validUntil: `${snap.date}T08:00:00Z`,
        source: 'CWC via ASDMA Daily Flood Report',
      },
      {
        id: 'asdma-cwc-flood',
        type: 'river-level',
        title: 'Rivers Above Highest Flood Level',
        level: (snap.rivers?.flood || []).length ? 'red' : 'green',
        value: (snap.rivers?.flood || []).length
          ? `${snap.rivers.flood.length} rivers`
          : 'None',
        unit: 'CWC bulletin · 8 AM (via ASDMA)',
        description:
          (snap.rivers?.flood || []).join(', ') ||
          'No rivers above highest flood level.',
        validUntil: `${snap.date}T08:00:00Z`,
        source: 'CWC via ASDMA Daily Flood Report',
      },
    ],
    meta: {
      reportDate: snap.date,
      scrapedAt: snap.scrapedAt,
      floodDataOrigin: 'asdma-daily-pdf-history',
      period: snap.date,
    },
  }
}
