import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Waves, Gauge } from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import DataFreshnessBanner from '../components/DataSourceBanner'
import ReportDateFilter from '../components/ui/ReportDateFilter'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { CardSkeleton } from '../components/ui/Skeleton'
import { useFetch } from '../hooks/useFetch'
import { getDashboardForDate, getReportDates } from '../services/historyService'
import { ALERT_LEVEL, formatDateTime } from '../utils/helpers'
import { formatReportDate } from '../utils/intelligence'

const ICONS = {
  'river-level': Waves,
  impact: Gauge,
  'heavy-rain': Waves,
  forecast: Gauge,
  rainfall: Gauge,
}

export default function Weather() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedDate = searchParams.get('date') || null

  const { data: dateInfo } = useFetch(getReportDates, [])
  const { data: dashboard, loading, error } = useFetch(
    () => getDashboardForDate(selectedDate),
    [selectedDate]
  )

  const alerts = dashboard?.weather || []
  const meta = dashboard?.meta
  const viewingHistorical = Boolean(selectedDate && dashboard && !dashboard.isLive)

  const setDate = useCallback(
    (date) => {
      setSearchParams(date ? { date } : {}, { replace: true })
    },
    [setSearchParams]
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <PageHeader
        title="River & Impact Alerts"
        subtitle="Official CWC river status and flood impact figures from the ASDMA daily report."
      />

      <div className="mb-4">
        <ReportDateFilter
          dates={dateInfo?.dates || []}
          liveDate={dateInfo?.liveDate}
          value={selectedDate}
          onChange={setDate}
        />
      </div>

      {meta && (
        <div className="mb-6">
          <DataFreshnessBanner meta={meta} compact />
        </div>
      )}

      {viewingHistorical && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm dark:border-primary-800 dark:bg-primary-950/40">
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

      {error ? (
        <ErrorState
          title="Could not load alerts"
          description="River and impact alerts are temporarily unavailable."
          onRetry={() => window.location.reload()}
        />
      ) : loading ? (
        <CardSkeleton count={3} />
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
      ) : alerts.length === 0 ? (
        <EmptyState
          title="No alerts in this report"
          description="This ASDMA PDF did not include river or impact alert cards."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {alerts.map((a, i) => {
            const Icon = ICONS[a.type] || Waves
            const levelClass = ALERT_LEVEL[a.level] || ALERT_LEVEL.warning
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="h-full">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge className={levelClass}>{a.level}</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {a.title}
                  </h3>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {a.value}
                  </p>
                  <p className="text-sm text-slate-500">{a.unit}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {a.description}
                  </p>
                  <p className="mt-4 text-xs text-slate-400">
                    {a.source} · As of {formatDateTime(a.validUntil)}
                  </p>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
