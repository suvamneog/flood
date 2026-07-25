export const SEVERITY = {
  severe: {
    label: 'Severe',
    color: 'bg-emergency/10 text-emergency border-emergency/20',
    dot: 'bg-emergency',
    map: '#ef4444',
  },
  moderate: {
    label: 'Moderate',
    color: 'bg-warning/10 text-warning-dark border-warning/20',
    dot: 'bg-warning',
    map: '#f97316',
  },
  waterlogging: {
    label: 'Waterlogging',
    color: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
    dot: 'bg-amber-500',
    map: '#f59e0b',
  },
  normal: {
    label: 'Normal',
    color: 'bg-success/10 text-success-dark border-success/20',
    dot: 'bg-success',
    map: '#22c55e',
  },
}

export const FLOOD_STATUS = {
  flooded: {
    label: 'Flooded',
    color: 'bg-emergency/10 text-emergency border-emergency/20',
    map: '#ef4444',
  },
  waterlogging: {
    label: 'Waterlogging',
    color: 'bg-warning/10 text-warning-dark border-warning/20',
    map: '#f97316',
  },
  safe: {
    label: 'Safe',
    color: 'bg-success/10 text-success-dark border-success/20',
    map: '#22c55e',
  },
}

export const ALERT_LEVEL = {
  red: 'bg-emergency/10 text-emergency border-emergency/20',
  orange: 'bg-warning/10 text-warning-dark border-warning/20',
  warning: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
  green: 'bg-success/10 text-success-dark border-success/20',
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

export const googleMapsUrl = (lat, lng, label = '') =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}${label ? `&query_place_id=${encodeURIComponent(label)}` : ''}`

export const telLink = (number) => `tel:${String(number).replace(/\s/g, '')}`

export const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/flood-map', label: 'Flood Map' },
  { to: '/districts', label: 'District Status' },
  { to: '/relief-camps', label: 'Relief Camps' },
  { to: '/emergency', label: 'Emergency' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/checklist', label: 'Checklist' },
  { to: '/updates', label: 'Updates' },
]
