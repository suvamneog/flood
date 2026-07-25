import { useState, useEffect } from 'react'
import { Search, MapPinned, Phone, Users, Tent } from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { ListSkeleton } from '../components/ui/Skeleton'
import { getReliefCamps } from '../services/campService'
import { getDistricts } from '../services/districtService'
import { googleMapsUrl, telLink } from '../utils/helpers'

export default function ReliefCamps() {
  const [query, setQuery] = useState('')
  const [district, setDistrict] = useState('all')
  const [camps, setCamps] = useState([])
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getDistricts()
      .then(setDistricts)
      .catch(() => setDistricts([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getReliefCamps({ district, query })
      .then((rows) => {
        if (!cancelled) setCamps(rows)
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setCamps([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [district, query])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <PageHeader
        title="Relief Camps"
        subtitle="District-level camp totals from the official ASDMA daily report. Call 1077 for exact camp addresses."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search by district…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-border-dark dark:bg-surface-dark-muted"
            />
          </div>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500 dark:border-border-dark dark:bg-surface-dark-muted sm:w-auto"
          >
            <option value="all">All Districts</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </PageHeader>

      {error ? (
        <ErrorState
          title="Could not load relief camps"
          description="Please try again in a moment."
          onRetry={() => {
            setDistrict('all')
            setQuery('')
          }}
        />
      ) : loading ? (
        <ListSkeleton count={4} />
      ) : camps.length === 0 ? (
        <EmptyState
          title="No relief camps listed"
          description="No district camp totals match your search, or none were reported in the latest ASDMA PDF."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {camps.map((camp, i) => (
            <motion.div
              key={camp.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="h-full">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  {camp.district}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {camp.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {camp.summary || camp.address}
                </p>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Tent className="h-4 w-4" />
                    {camp.campCount ?? '—'} camps reported
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {(camp.campInmates ?? camp.occupied ?? 0).toLocaleString('en-IN')}{' '}
                    inmates
                  </span>
                  <a
                    href={telLink(camp.phone)}
                    className="inline-flex items-center gap-1.5 font-medium text-primary-600 hover:underline dark:text-primary-400"
                  >
                    <Phone className="h-4 w-4" />
                    {camp.phone}
                  </a>
                </div>

                {camp.coordinates?.lat != null && (
                  <div className="mt-5">
                    <Button
                      variant="soft"
                      size="sm"
                      href={googleMapsUrl(
                        camp.coordinates.lat,
                        camp.coordinates.lng,
                        camp.district
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPinned className="h-4 w-4" />
                      Open district on Maps
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
