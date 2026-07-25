import { CalendarDays } from 'lucide-react'
import { formatReportDate } from '../../utils/intelligence'

/**
 * Dropdown to switch between archived ASDMA report dates.
 * `value` is ISO date (YYYY-MM-DD) or null/empty for latest.
 */
export default function ReportDateFilter({
  dates = [],
  liveDate,
  value,
  onChange,
  className = '',
}) {
  if (!dates.length) return null

  const selected = value || liveDate || dates[0]

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border border-border bg-white p-3 dark:border-border-dark dark:bg-surface-dark-muted sm:flex-row sm:items-center sm:gap-3 sm:px-4 ${className}`}
    >
      <label
        htmlFor="report-date-filter"
        className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300"
      >
        <CalendarDays className="h-4 w-4 text-primary-600" />
        Report date
      </label>
      <select
        id="report-date-filter"
        value={selected}
        onChange={(e) => {
          const next = e.target.value
          onChange(next === liveDate ? null : next)
        }}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-primary-500 dark:border-border-dark dark:bg-surface-dark dark:text-slate-100 sm:max-w-xs"
      >
        {dates.map((d) => (
          <option key={d} value={d}>
            {formatReportDate(d)}
            {d === liveDate ? ' · latest' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
