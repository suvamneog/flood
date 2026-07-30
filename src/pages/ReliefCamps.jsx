import { useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, MapPinned, Phone, Users, Tent } from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ReportDateFilter from '../components/ui/ReportDateFilter'
import DataFreshnessBanner from '../components/DataSourceBanner'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { ListSkeleton } from '../components/ui/Skeleton'
import { useFetch } from '../hooks/useFetch'
import { getDashboardForDate, getReportDates } from '../services/historyService'
import { googleMapsUrl, telLink } from '../utils/helpers'
import { formatReportDate } from '../utils/intelligence'

export default function ReliefCamps() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedDate = searchParams.get('date') || null
  const [query, setQuery] = useState('')
  const [district, setDistrict] = useState('all')

  const { data: dateInfo } = useFetch(getReportDates, [])
  const { data: dashboard, loading, error } = useFetch(
    () => getDashboardForDate(selectedDate),
    [selectedDate]
  )

  const districts = dashboard?.districts || []
  const meta = dashboard?.meta
  const viewingHistorical = Boolean(selectedDate && dashboard && !dashboard.isLive)

  const camps = useMemo(() => {
    let rows = [...(dashboard?.reliefCamps || [])]
    if (district !== 'all') {
      rows = rows.filter(
        (c) =>
          c.districtId === district ||
          c.district.toLowerCase() === district.toLowerCase()
      )
    }
    if (query) {
      const q = query.toLowerCase()
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.summary || '').toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q)
      )
    }
    return rows
  }, [dashboard, district, query])

  const setDate = useCallback(
    (date) => {
      setSearchParams(date ? { date } : {}, { replace: true })
      setDistrict('all')
      setQuery('')
    },
    [setSearchParams]
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <PageHeader
        title="Relief Camps"
        subtitle="District-level camp totals from the official ASDMA daily report. Call 1077 for exact camp addresses."
      >
        <div className="mb-4">
          <ReportDateFilter
            dates={dateInfo?.dates || []}
            liveDate={dateInfo?.liveDate}
            value={selectedDate}
            onChange={setDate}
          />
        </div>

        {meta && (
          <div className="mb-4">
            <DataFreshnessBanner meta={meta} compact />
          </div>
        )}

        {viewingHistorical && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm dark:border-primary-800 dark:bg-primary-950/40">
            <span className="font-medium text-primary-800 dark:text-primary-200">
              Viewing archived report · {formatReportDate(selectedDate)}
            </span>
            <button
              type="button"
              onClick={() => setDate(null)}
              className="font-bold text-primary-700 hover:underline dark:text-primary-300"
            >
              Return to latest
            </button>
          </div>
        )}

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
          onRetry={() => window.location.reload()}
        />
      ) : loading ? (
        <ListSkeleton count={4} />
      ) : !dashboard ? (
        <EmptyState
          title="Report not found"
          description="That date is not in the archive. Pick another report date or return to the latest."
          action={
            <button
              type="button"
              onClick={() => setDate(null)}
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white"
            >
              Return to latest
            </button>
          }
        />
      ) : camps.length === 0 ? (
        <EmptyState
          title="No relief camps listed"
          description="No district camp totals match your search, or none were reported in this ASDMA PDF."
          action={
            query || district !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setDistrict('all')
                  setQuery('')
                }}
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white"
              >
                Clear filters
              </button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {camps.map((camp, i) => {
            const mapsUrl = googleMapsUrl(
              camp.coordinates?.lat,
              camp.coordinates?.lng,
              camp.district
            )
            return (
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

                {mapsUrl ? (
                  <div className="mt-5">
                    <Button
                      variant="soft"
                      size="sm"
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPinned className="h-4 w-4" />
                      Open district on Maps
                    </Button>
                  </div>
                ) : null}
              </Card>
            </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
