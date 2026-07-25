import { motion } from 'framer-motion'

export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-8 sm:mb-10">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white"
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-2 max-w-2xl text-base text-slate-600 dark:text-slate-400"
        >
          {subtitle}
        </motion.p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}
