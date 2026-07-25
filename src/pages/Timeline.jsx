import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, Users, Tent, MapPin, Waves } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import { ListSkeleton } from '../components/ui/Skeleton'
import { useFetch } from '../hooks/useFetch'
import { getHistory } from '../services/historyService'
import {
  formatIndianNumber,
  formatReportDate,
  formatSyncTime,
} from '../utils/intelligence'

export default function Timeline() {
  const navigate = useNavigate()
  const { data, loading, error } = useFetch(getHistory, [])
  const reports = data?.reports || []

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Past Flood Reports"
        subtitle="Every imported ASDMA daily flood report. Tap a date to open that day's district figures, camps, and map."
      />

      {error ? (
        <EmptyState
          title="Could not load past reports"
          description="The local report archive failed to load. Refresh the page and try again."
        />
      ) : loading ? (
        <ListSkeleton count={4} />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No reports archived yet"
          description="Run npm run scrape:pdf to download the latest ASDMA PDF and start building history."
        />
      ) : (
        <div className="relative">
          <div className="absolute bottom-4 left-[19px] top-4 w-px bg-border dark:bg-border-dark" />
          <div className="space-y-4">
            {reports.map((r, i) => (
              <motion.button
                key={r.date}
                type="button"
                onClick={() => navigate(`/districts?date=${r.date}`)}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 260, damping: 24 }}
                whileHover={{ x: 4 }}
                className="relative flex w-full gap-4 text-left sm:gap-5"
              >
                <span className="relative z-10 mt-5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary-500 bg-white dark:bg-surface-dark">
                  <CalendarDays className="h-4 w-4 text-primary-600" />
                </span>
                <div className="flex-1 rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-primary-300 hover:shadow-md dark:border-border-dark dark:bg-surface-dark-muted dark:hover:border-primary-700">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {formatReportDate(r.date)}
                    </h3>
                    <span className="text-xs text-slate-400">
                      Synced {formatSyncTime(r.scrapedAt)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {formatIndianNumber(r.stats?.peopleAffected)} people
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {formatIndianNumber(r.stats?.floodedDistricts)} districts
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Tent className="h-3.5 w-3.5 text-slate-400" />
                      {formatIndianNumber(r.stats?.reliefCamps)} camps
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Waves className="h-3.5 w-3.5 text-slate-400" />
                      {formatIndianNumber(
                        r.stats?.riverWarnings ?? r.stats?.activeAlerts
                      )}{' '}
                      river alerts
                    </span>
                  </div>
                  {r.topDistricts?.[0] && (
                    <p className="mt-3 text-xs text-slate-500">
                      Worst hit: {r.topDistricts[0].name}
                      {r.topDistricts[1] ? `, ${r.topDistricts[1].name}` : ''}
                      {r.topDistricts[2] ? `, ${r.topDistricts[2].name}` : ''}
                    </p>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
