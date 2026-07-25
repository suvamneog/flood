import { motion } from 'framer-motion'
import {
  Tent,
  Waves,
  AlertTriangle,
  PackageX,
  Siren,
  Users,
  Radio,
  Lightbulb,
} from 'lucide-react'
import { generateRecommendations } from '../../utils/intelligence'
import EmptyState from '../ui/EmptyState'

const ICONS = {
  Tent,
  Waves,
  AlertTriangle,
  PackageX,
  Siren,
  Users,
  Radio,
}

const PRIORITY = {
  critical: 'border-emergency/30 bg-emergency/5 text-emergency',
  high: 'border-warning/30 bg-warning/5 text-warning-dark',
  medium: 'border-primary-200 bg-primary-50/60 text-primary-700 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300',
  low: 'border-success/30 bg-success/5 text-success-dark',
}

export default function AiRecommendations({ stats, districts, weather }) {
  const tips = generateRecommendations({ stats, districts, weather })

  if (!tips.length) {
    return (
      <EmptyState
        title="No recommendations"
        description="Recommendations appear once flood situation data is available."
      />
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Situation Guidance
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Rule-based tips from the latest ASDMA snapshot (not an AI model)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {tips.map((tip, i) => {
          const Icon = ICONS[tip.icon] || Lightbulb
          return (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark-muted"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${PRIORITY[tip.priority]}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800">
                  {tip.priority}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">{tip.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {tip.description}
              </p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
