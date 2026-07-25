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
      className={`rounded-2xl border border-border bg-white dark:border-border-dark dark:bg-surface-dark-muted ${
        hover ? 'transition-colors duration-150 hover:border-primary-300 dark:hover:border-primary-700' : ''
      } ${
        padding ? 'p-5 sm:p-6' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}
