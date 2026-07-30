import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  HeartHandshake,
  Landmark,
  Users,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Phone,
  Info,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import donationsData from '../data/donations.json'
import { telLink } from '../utils/helpers'

const FILTERS = [
  { id: 'all', label: 'All channels' },
  { id: 'government', label: 'Government', icon: Landmark },
  { id: 'ngo', label: 'NGOs', icon: Users },
]

function isSafeExternal(url) {
  return typeof url === 'string' && /^https:\/\//i.test(url)
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false)
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable — ignore silently */
    }
  }
  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-700 dark:border-border-dark dark:bg-slate-800 dark:text-slate-300 dark:hover:text-primary-300"
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function ChannelCard({ c, index }) {
  const primaryUrl = isSafeExternal(c.donateUrl)
    ? c.donateUrl
    : isSafeExternal(c.url)
      ? c.url
      : null
  const learnMoreUrl = isSafeExternal(c.url) ? c.url : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 6) * 0.04 }}
    >
      <Card className="flex h-full flex-col">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                  c.kind === 'government'
                    ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                }`}
              >
                {c.kind === 'government' ? (
                  <Landmark className="h-3 w-3" />
                ) : (
                  <Users className="h-3 w-3" />
                )}
                {c.kind === 'government' ? 'Government' : 'NGO'}
              </span>
              {c.recommended && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  <ShieldCheck className="h-3 w-3" />
                  Recommended
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{c.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{c.organization}</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {c.summary}
        </p>

        {(c.upi || c.account) && (
          <div className="mt-4 space-y-2 rounded-xl border border-border bg-slate-50 p-3 text-xs dark:border-border-dark dark:bg-slate-900/40">
            {c.upi && (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    UPI ID
                  </p>
                  <p className="truncate font-mono text-sm text-slate-900 dark:text-slate-100">
                    {c.upi}
                  </p>
                </div>
                <CopyButton value={c.upi} label="UPI ID" />
              </div>
            )}
            {c.account?.number && (
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      A/C number
                    </p>
                    <p className="truncate font-mono text-sm text-slate-900 dark:text-slate-100">
                      {c.account.number}
                    </p>
                  </div>
                  <CopyButton value={c.account.number} label="account number" />
                </div>
                {c.account.ifsc && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        IFSC
                      </p>
                      <p className="truncate font-mono text-sm text-slate-900 dark:text-slate-100">
                        {c.account.ifsc}
                      </p>
                    </div>
                    <CopyButton value={c.account.ifsc} label="IFSC" />
                  </div>
                )}
              </div>
            )}
            {c.account?.bank && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {c.account.bank}
              </p>
            )}
          </div>
        )}

        {c.tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {c.tags.map((t) => (
              <Badge
                key={t}
                className="border border-slate-200 bg-slate-100 text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {t}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2 pt-4">
          {primaryUrl && (
            <Button
              href={primaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
            >
              <HeartHandshake className="h-4 w-4" />
              Donate on official site
            </Button>
          )}
          {learnMoreUrl && learnMoreUrl !== primaryUrl && (
            <Button
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="sm"
            >
              <ExternalLink className="h-4 w-4" />
              Learn more
            </Button>
          )}
          {c.phone && (
            <a
              href={telLink(c.phone)}
              className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1 text-xs font-medium text-slate-500 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <Phone className="h-3.5 w-3.5" />
              {c.phone}
            </a>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

export default function Donate() {
  const [filter, setFilter] = useState('all')

  const channels = useMemo(() => {
    const rows = donationsData.channels || []
    if (filter === 'all') return rows
    return rows.filter((c) => c.kind === filter)
  }, [filter])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <PageHeader
        title="Help flood-affected families"
        subtitle="Verified donation channels for Assam flood relief. Every button opens the organisation's own official site — FloodAssist Assam does not collect or route any money."
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const Icon = f.icon
          const active = filter === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                active
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'border-border bg-white text-slate-600 hover:border-primary-300 dark:border-border-dark dark:bg-surface-dark-muted dark:text-slate-300'
              }`}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {f.label}
            </button>
          )
        })}
        {donationsData.lastVerified && (
          <span className="ml-auto text-xs text-slate-400">
            Last verified {donationsData.lastVerified}
          </span>
        )}
      </div>

      {donationsData.note && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{donationsData.note}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {channels.map((c, i) => (
          <ChannelCard key={c.id} c={c} index={i} />
        ))}
      </div>

      {donationsData.inKindNote && (
        <div className="mt-10 rounded-2xl border border-border bg-white p-5 dark:border-border-dark dark:bg-surface-dark-muted">
          <div className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Info className="h-4 w-4 text-primary-600" />
            Donating supplies (not money)?
          </div>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {donationsData.inKindNote}
          </p>
        </div>
      )}
    </div>
  )
}
