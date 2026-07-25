import { motion } from 'framer-motion'
import { Waves } from 'lucide-react'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import { buildRiverIntelligence } from '../../utils/intelligence'

const BADGE = {
  critical: 'bg-emergency/10 text-emergency border-emergency/20',
  danger: 'bg-warning/10 text-warning-dark border-warning/20',
  warning: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
}

export default function RiverIntelligence({ weather, historyReports }) {
  const rivers = buildRiverIntelligence(weather, historyReports)

  if (!rivers.length) {
    return (
      <EmptyState
        title="No river warnings"
        description="No rivers are currently reported above danger or highest flood level."
      />
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          River Intelligence
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          CWC levels published via the ASDMA daily report
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rivers.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark-muted"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
                <Waves className="h-5 w-5" />
              </div>
              <Badge className={BADGE[r.badge] || BADGE.warning}>{r.status}</Badge>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{r.river}</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Trend</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">{r.trend}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Warning</dt>
                <dd className="text-right font-medium text-slate-700 dark:text-slate-300">
                  {r.warning}
                </dd>
              </div>
              {r.affectedDistricts?.length > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Affected</dt>
                  <dd className="text-right font-semibold text-slate-800 dark:text-slate-200">
                    {r.affectedDistricts.join(', ')}
                  </dd>
                </div>
              )}
            </dl>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
