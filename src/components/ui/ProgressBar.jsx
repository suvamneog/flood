import { motion } from 'framer-motion'

export default function ProgressBar({ value, max = 100, className = '' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600 dark:text-slate-300">
          Progress
        </span>
        <span className="font-bold text-primary-600 dark:text-primary-400">
          {pct}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  )
}
