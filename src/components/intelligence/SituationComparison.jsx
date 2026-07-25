import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import {
  compareSituations,
  formatIndianNumber,
  formatReportDate,
} from '../../utils/intelligence'
import EmptyState from '../ui/EmptyState'

export default function SituationComparison({ stats, previousReport }) {
  const comparison = compareSituations(stats, previousReport)

  if (!comparison.available) {
    return (
      <EmptyState
        title="No previous report available"
        description="Comparison needs at least two imported ASDMA daily reports. Run the scraper again tomorrow or seed history."
      />
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Situation Comparison
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            vs previous report · {formatReportDate(comparison.previousDate)}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {comparison.items.map((item, i) => {
          const ToneIcon =
            item.tone === 'worse'
              ? ArrowUpRight
              : item.tone === 'better'
                ? ArrowDownRight
                : Minus
          const toneClass =
            item.tone === 'worse'
              ? 'text-emergency bg-emergency/10'
              : item.tone === 'better'
                ? 'text-success-dark bg-success/10'
                : 'text-slate-500 bg-slate-100 dark:bg-slate-800'

          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark-muted"
            >
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {formatIndianNumber(item.current)}
              </p>
              <div
                className={`mt-3 inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-sm font-bold ${toneClass}`}
              >
                <ToneIcon className="h-4 w-4" />
                {item.delta === 0
                  ? 'No change'
                  : `${item.delta > 0 ? '+' : ''}${formatIndianNumber(item.delta)}`}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
