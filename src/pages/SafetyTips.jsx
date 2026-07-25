import {
  Waves,
  ZapOff,
  Droplets,
  Briefcase,
  Mountain,
  Radio,
  Users,
  ShieldCheck,
} from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import { CardSkeleton } from '../components/ui/Skeleton'
import { useFetch } from '../hooks/useFetch'
import { getSafetyTips } from '../services/contentService'

const ICONS = {
  Waves,
  ZapOff,
  Droplets,
  Briefcase,
  Mountain,
  Radio,
  Users,
  ShieldCheck,
}

export default function SafetyTips() {
  const { data: tips, loading } = useFetch(getSafetyTips, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Safety Tips"
        subtitle="Simple steps that can save lives before and during floods."
      />

      {loading || !tips ? (
        <CardSkeleton count={8} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tips.map((tip, i) => {
            const Icon = ICONS[tip.icon] || Waves
            return (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 4) * 0.05 }}
              >
                <Card className="h-full">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {tip.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {tip.description}
                  </p>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
