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
      className="relative overflow-hidden rounded-2xl bg-primary-800 p-6 text-white sm:p-8"
    >
      <div className="relative border-l-2 border-primary-300/60 pl-5 sm:pl-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white">
            <FileText className="h-4 w-4 text-primary-300" />
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
