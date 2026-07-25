import { useState, useEffect } from 'react'
import PageHeader from '../components/ui/PageHeader'
import FloodMapView from '../components/map/FloodMapView'
import MapFilters from '../components/map/MapFilters'
import DataFreshnessBanner from '../components/DataSourceBanner'
import DistrictSearch from '../components/ui/DistrictSearch'
import DistrictDrawer from '../components/ui/DistrictDrawer'
import ErrorState from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { FLOOD_STATUS, formatRelative } from '../utils/helpers'
import Badge from '../components/ui/Badge'
import { getFloodReports } from '../services/floodService'
import { getDistricts } from '../services/districtService'
import { getMeta } from '../services/metaService'
import { useFetch } from '../hooks/useFetch'

export default function FloodMapPage() {
  const [district, setDistrict] = useState('all')
  const [status, setStatus] = useState('all')
  const [reports, setReports] = useState([])
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const { data: meta } = useFetch(getMeta, [])

  useEffect(() => {
    getDistricts()
      .then(setDistricts)
      .catch(() => setDistricts([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getFloodReports({ district, status })
      .then((rows) => {
        if (!cancelled) setReports(rows)
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setReports([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [district, status])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <PageHeader
        title="Live Flood Map"
        subtitle="Districts are shaded by severity — tap any district or pin for details."
      >
        {meta && (
          <div className="mb-4">
            <DataFreshnessBanner meta={meta} compact />
          </div>
        )}

        <div className="mb-4 max-w-md">
          <DistrictSearch
            districts={districts}
            onSelect={(d) => {
              setDistrict(d.id)
              setSelectedDistrict(d)
            }}
          />
        </div>

        <MapFilters
          districts={districts}
          district={district}
          status={status}
          onDistrictChange={setDistrict}
          onStatusChange={setStatus}
        />
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
          {Object.entries(FLOOD_STATUS).map(([key, val]) => (
            <span key={key} className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: val.map }}
              />
              {val.label} pin
            </span>
          ))}
        </div>
      </PageHeader>

      {error ? (
        <ErrorState
          title="Could not load the flood map"
          description="Please try again in a moment."
          onRetry={() => window.location.reload()}
        />
      ) : loading ? (
        <Skeleton className="h-[420px] w-full rounded-2xl sm:h-[520px] lg:h-[560px]" />
      ) : (
        <FloodMapView
          reports={reports}
          districts={districts}
          onDistrictClick={setSelectedDistrict}
        />
      )}

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
          Reports ({reports.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => {
            const s = FLOOD_STATUS[r.status]
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-border bg-white p-4 dark:border-border-dark dark:bg-surface-dark-muted"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {r.location}
                    </p>
                    <p className="text-xs text-slate-500">{r.district}</p>
                  </div>
                  <Badge className={s.color}>{s.label}</Badge>
                </div>
                <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                  {r.description}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {formatRelative(r.lastUpdated)}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <DistrictDrawer
        district={selectedDistrict}
        open={Boolean(selectedDistrict)}
        onClose={() => setSelectedDistrict(null)}
      />
    </div>
  )
}
