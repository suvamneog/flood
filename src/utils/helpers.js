export const SEVERITY = {
  severe: {
    label: 'Severe',
    // Darker text + stronger fill for WCAG-friendly contrast under glare/stress
    color: 'bg-red-100 text-red-950 border-red-300 dark:bg-red-950 dark:text-red-100 dark:border-red-700',
    dot: 'bg-emergency',
    map: '#ef4444',
  },
  moderate: {
    label: 'Moderate',
    color: 'bg-orange-100 text-orange-950 border-orange-300 dark:bg-orange-950 dark:text-orange-100 dark:border-orange-700',
    dot: 'bg-warning',
    map: '#f97316',
  },
  waterlogging: {
    label: 'Waterlogging',
    color: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-700',
    dot: 'bg-amber-500',
    map: '#f59e0b',
  },
  normal: {
    label: 'Normal',
    color: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-700',
    dot: 'bg-success',
    map: '#22c55e',
  },
}

export const FLOOD_STATUS = {
  flooded: {
    label: 'Flooded',
    color: 'bg-red-100 text-red-950 border-red-300 dark:bg-red-950 dark:text-red-100 dark:border-red-700',
    map: '#ef4444',
  },
  waterlogging: {
    label: 'Waterlogging',
    color: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-700',
    map: '#f59e0b',
  },
  safe: {
    label: 'Safe',
    color: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-700',
    map: '#22c55e',
  },
}

export const ALERT_LEVEL = {
  red: 'bg-red-100 text-red-950 border-red-300 dark:bg-red-950 dark:text-red-100 dark:border-red-700',
  orange: 'bg-orange-100 text-orange-950 border-orange-300 dark:bg-orange-950 dark:text-orange-100 dark:border-orange-700',
  warning: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-700',
  green: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-700',
}

export const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const formatDateTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatRelative = (iso) => {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/** Google Maps search URL — returns null if coords are invalid / out of Assam+NE buffer. */
export const googleMapsUrl = (lat, lng, label = '') => {
  const la = Number(lat)
  const ln = Number(lng)
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null
  // Assam / NE India with modest buffer
  if (la < 22 || la > 29.5 || ln < 88 || ln > 98) return null
  const query = label
    ? `${la},${ln} (${String(label).slice(0, 80)})`
    : `${la},${ln}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

/** Safe tel: link — digits and leading + only (blocks javascript:/data: abuse). */
export const telLink = (number) => {
  const raw = String(number || '').trim()
  if (!raw || /^(javascript|data|vbscript):/i.test(raw) || /[a-z]/i.test(raw)) {
    return '#'
  }
  const cleaned = raw.replace(/[^\d+]/g, '')
  const normalized = cleaned.startsWith('+')
    ? `+${cleaned.slice(1).replace(/\D/g, '')}`
    : cleaned.replace(/\D/g, '')
  // Emergency short codes (100/101/108) and longer lines
  if (!/^\+?\d{2,15}$/.test(normalized)) return '#'
  return `tel:${normalized}`
}

export const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/flood-map', label: 'Flood Map' },
  { to: '/districts', label: 'District Status' },
  { to: '/relief-camps', label: 'Relief Camps' },
  { to: '/emergency', label: 'Emergency' },
  { to: '/donate', label: 'Donate' },
  { to: '/timeline', label: 'Past Reports' },
  { to: '/checklist', label: 'Checklist' },
  { to: '/updates', label: 'Updates' },
]
