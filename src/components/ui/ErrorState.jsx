import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from './Button'

/**
 * Friendly error panel — never renders stack traces or raw exception text.
 */
export default function ErrorState({
  title = 'Unable to load this page',
  description = 'Please check your connection and try again. If the problem continues, come back in a few minutes.',
  onRetry,
  compact = false,
}) {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center rounded-3xl border border-emergency/20 bg-gradient-to-b from-red-50 to-white text-center dark:border-emergency/30 dark:from-red-950/30 dark:to-surface-dark-muted ${
        compact ? 'px-4 py-8' : 'px-5 py-12 sm:px-8 sm:py-14'
      }`}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emergency/10 text-emergency">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {description}
      </p>
      {onRetry && (
        <div className="mt-5">
          <Button type="button" variant="soft" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      )}
    </motion.div>
  )
}
