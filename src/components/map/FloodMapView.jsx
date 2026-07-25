import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { Layers } from 'lucide-react'
import { FLOOD_STATUS, SEVERITY, formatDateTime } from '../../utils/helpers'
import Badge from '../ui/Badge'
import assamGeo from '../../data/assamDistricts.geo.json'

function createIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,.25);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  })
}

const ASSAM_CENTER = [26.2, 92.9]
const ZOOM = 7

const slug = (name = '') =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Escape scraped strings before injecting into Leaflet HTML tooltips. */
const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** GeoJSON district name → our district id aliases */
const GEO_ALIASES = {
  'kamrup-metropolitan': 'kamrup-metro',
  'south-salmara-mankachar': 'south-salmara',
  karimganj: 'sribhumi',
}

const HEAT_COLORS = {
  severe: '#ef4444',
  moderate: '#f97316',
  waterlogging: '#f59e0b',
  normal: '#22c55e',
}

export default function FloodMapView({
  reports = [],
  districts = [],
  onDistrictClick,
}) {
  const [heatOn, setHeatOn] = useState(true)

  const icons = useMemo(
    () => ({
      flooded: createIcon(FLOOD_STATUS.flooded.map),
      waterlogging: createIcon(FLOOD_STATUS.waterlogging.map),
      safe: createIcon(FLOOD_STATUS.safe.map),
    }),
    []
  )

  const districtById = useMemo(() => {
    const m = new Map()
    for (const d of districts) m.set(d.id, d)
    return m
  }, [districts])

  const lookupDistrict = (geoName) => {
    const s = slug(geoName)
    return districtById.get(GEO_ALIASES[s] || s) || null
  }

  // Districts absent from the report are treated as Normal
  const geoStyle = (feature) => {
    const d = lookupDistrict(feature.properties.district)
    const sev = d?.severity || 'normal'
    return {
      color: HEAT_COLORS[sev],
      weight: 1.2,
      fillColor: HEAT_COLORS[sev],
      fillOpacity: sev === 'normal' ? 0.12 : 0.35,
    }
  }

  const onEachFeature = (feature, layer) => {
    const d = lookupDistrict(feature.properties.district)
    const sev = SEVERITY[d?.severity] || SEVERITY.normal
    const name = d?.name || feature.properties.district
    const pop = d?.populationAffected || 0

    layer.bindTooltip(
      `<div style="font-weight:700">${escapeHtml(name)}</div>
       <div style="font-size:11px">${escapeHtml(sev.label)}${
         pop > 0 ? ` · ${escapeHtml(pop.toLocaleString('en-IN'))} affected` : ''
       }</div>`,
      { sticky: true, direction: 'top', opacity: 0.95 }
    )

    layer.on({
      mouseover: (e) => {
        e.target.setStyle({ weight: 2.5, fillOpacity: 0.5 })
      },
      mouseout: (e) => {
        e.target.setStyle(geoStyle(feature))
      },
      click: () => {
        if (d && onDistrictClick) onDistrictClick(d)
      },
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setHeatOn((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-95 ${
            heatOn
              ? 'border-primary-300 bg-primary-600 text-white'
              : 'border-border bg-white text-slate-700 dark:border-border-dark dark:bg-surface-dark-muted dark:text-slate-200'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Heat layer
        </button>
      </div>

      <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-border shadow-sm dark:border-border-dark sm:h-[520px] lg:h-[560px]">
        <MapContainer
          center={ASSAM_CENTER}
          zoom={ZOOM}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {heatOn && (
            <GeoJSON
              key={`heat-${districts.length}`}
              data={assamGeo}
              style={geoStyle}
              onEachFeature={onEachFeature}
            />
          )}

          {reports.map((r) => {
            const status = FLOOD_STATUS[r.status] || FLOOD_STATUS.safe
            return (
              <Marker
                key={r.id}
                position={[r.coordinates.lat, r.coordinates.lng]}
                icon={icons[r.status] || icons.safe}
              >
                <Popup>
                  <div className="min-w-[200px] space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{r.location}</p>
                        <p className="text-xs text-slate-500">{r.district}</p>
                      </div>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">
                      {r.description}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Pin ≈ district HQ · Updated {formatDateTime(r.lastUpdated)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {/* Severity legend */}
        <div className="absolute bottom-3 left-3 z-[400] flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2 rounded-xl border border-border bg-white/90 px-3 py-2 text-[11px] font-semibold shadow-md backdrop-blur dark:border-border-dark dark:bg-slate-900/90">
          {Object.entries(HEAT_COLORS).map(([key, color]) => (
            <span key={key} className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: color, opacity: 0.8 }}
              />
              {SEVERITY[key].label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
