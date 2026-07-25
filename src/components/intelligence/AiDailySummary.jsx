import { FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { generateDailySummary, formatReportDate } from '../../utils/intelligence'
import EmptyState from '../ui/EmptyState'

export default function AiDailySummary({ stats, districts, weather, meta }) {
  const summary = generateDailySummary({ stats, districts, weather, meta })

  if (!summary) {
    return (
      <EmptyState
        title="Summary unavailable"
        description="Import an ASDMA daily report to generate today’s brief."
      />
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-primary-200/80 bg-gradient-to-br from-primary-600 via-primary-700 to-sky-800 p-6 text-white shadow-xl shadow-primary-600/20 sm:p-8"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-sky-300/20 blur-3xl" />

      <div className="relative">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur">
            <FileText className="h-3.5 w-3.5" />
            {summary.title}
          </span>
          <span className="text-xs font-medium text-primary-100">
            Report · {formatReportDate(summary.reportDate)}
          </span>
        </div>

        <div className="space-y-3 text-[15px] leading-relaxed text-primary-50 sm:text-base">
          {summary.paragraphs.map((p) => (
            <p key={p.slice(0, 48)}>{p}</p>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-primary-100/80">
          Generated from official ASDMA figures
        </p>
      </div>
    </motion.section>
  )
}
