import { motion } from 'framer-motion'
import { Heart, Map, Phone, Shield } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'

const pillars = [
  {
    icon: Map,
    title: 'Clear information',
    desc: 'Flood status, camps and alerts in one calm, readable place.',
  },
  {
    icon: Phone,
    title: 'Fast emergency access',
    desc: 'One-tap SOS for police, ambulance, fire, SDRF and ASDMA.',
  },
  {
    icon: Shield,
    title: 'Preparedness first',
    desc: 'Checklists and safety tips so families can pack and plan ahead.',
  },
  {
    icon: Heart,
    title: 'Built for Assam',
    desc: 'Designed around Assam’s districts, rivers and flood season reality.',
  },
]

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="About FloodAssist Assam"
        subtitle="Making flood information easier to access for the people of Assam."
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="prose prose-slate dark:prose-invert mb-10"
      >
        <Card>
          <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
            Every monsoon, floods disrupt lives across Assam. Critical
            information — which districts are flooded, where relief camps are
            open, whom to call — is often scattered across notices, social media
            and word of mouth.
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">
              FloodAssist Assam
            </strong>{' '}
            was created to bring that information together in a clean, mobile-first
            experience. The goal is simple: help people check flood situations,
            find relief camps, reach emergency services and follow official
            updates — quickly, clearly and without clutter.
          </p>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            This platform is informational only. Always follow official guidance
            from ASDMA, District Administration and IMD. Flood figures in this app
            are ingested from the official ASDMA / SDRF Daily Flood Report PDF.
          </p>
        </Card>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        {pillars.map((p, i) => {
          const Icon = p.icon
          return (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="h-full">
                <Icon className="mb-3 h-6 w-6 text-primary-600 dark:text-primary-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {p.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {p.desc}
                </p>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
