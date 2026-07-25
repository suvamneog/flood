import { motion } from 'framer-motion'

export default function Card({
  children,
  className = '',
  hover = true,
  padding = true,
  onClick,
}) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { y: -3 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`rounded-2xl border border-border bg-white shadow-sm shadow-slate-200/60 dark:border-border-dark dark:bg-surface-dark-muted dark:shadow-none ${
        padding ? 'p-5 sm:p-6' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}
