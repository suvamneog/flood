import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'

export default function EmptyState({
  title = 'Nothing here yet',
  description = 'Data will appear once an official ASDMA report is available.',
  action,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-gradient-to-b from-slate-50 to-white px-6 py-14 text-center dark:border-border-dark dark:from-slate-900/60 dark:to-surface-dark-muted"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-primary-200/40 blur-2xl dark:bg-primary-800/30" />
        <svg
          viewBox="0 0 160 120"
          className="relative h-28 w-40"
          aria-hidden="true"
        >
          <ellipse cx="80" cy="96" rx="54" ry="10" fill="#E2E8F0" className="dark:fill-slate-700" />
          <path
            d="M20 78 C40 58 55 72 80 64 C105 56 120 70 140 62 L140 96 L20 96 Z"
            fill="#93C5FD"
            opacity="0.7"
          />
          <path
            d="M28 88 C48 74 70 86 90 78 C110 70 125 80 138 74"
            stroke="#2563EB"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
          />
          <rect x="62" y="42" width="36" height="28" rx="4" fill="#F8FAFC" stroke="#CBD5E1" />
          <path d="M58 42 L80 28 L102 42" fill="#EFF6FF" stroke="#93C5FD" />
        </svg>
        <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-white shadow-md dark:bg-slate-800">
          <Inbox className="h-4 w-4 text-slate-400" />
        </span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}
