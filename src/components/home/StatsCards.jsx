import { MapPin, Users, Tent, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from '../ui/Card'
import AnimatedCounter from '../ui/AnimatedCounter'
import { CardSkeleton } from '../ui/Skeleton'
import { formatDateTime } from '../../utils/helpers'

const items = [
  {
    key: 'floodedDistricts',
    label: 'Affected Districts',
    icon: MapPin,
    color: 'text-emergency bg-emergency/10',
  },
  {
    key: 'peopleAffected',
    label: 'People Affected',
    icon: Users,
    color: 'text-warning-dark bg-warning/10',
  },
  {
    key: 'reliefCamps',
    label: 'Relief Camps',
    icon: Tent,
    color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/40 dark:text-primary-400',
  },
  {
    key: 'lastUpdated',
    label: 'Report Date',
    icon: Clock,
    color: 'text-success-dark bg-success/10',
    isDate: true,
  },
]

export default function StatsCards({ stats, loading }) {
  if (loading || !stats) return <CardSkeleton count={4} />

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className="h-full">
              <div
                className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {item.isDate ? (
                  formatDateTime(stats[item.key])
                ) : (
                  <AnimatedCounter value={Number(stats[item.key]) || 0} />
                )}
              </p>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
