import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  HeartHandshake,
  Landmark,
  Users,
  ExternalLink,
  Copy,
  Check,
  Phone,
  Info,
  Radio,
  ArrowUpRight,
  HandHeart,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import donationsData from '../data/donations.json'
import { telLink } from '../utils/helpers'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'government', label: 'Government', icon: Landmark },
  { id: 'ngo', label: 'NGOs', icon: Users },
  { id: 'creator', label: 'Creators', icon: Radio },
]

const KIND_META = {
  government: {
    label: 'Government',
    icon: Landmark,
    chip: 'border-primary-200 bg-primary-50 text-primary-800 dark:border-primary-800 dark:bg-primary-950/50 dark:text-primary-200',
    accent: 'from-primary-500 to-primary-700',
    soft: 'bg-primary-50/80 dark:bg-primary-950/30',
  },
  ngo: {
    label: 'NGO',
    icon: Users,
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
    accent: 'from-emerald-500 to-teal-700',
    soft: 'bg-emerald-50/70 dark:bg-emerald-950/25',
  },
  creator: {
    label: 'Creator campaign',
    icon: Radio,
    chip: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
    accent: 'from-amber-500 to-orange-600',
    soft: 'bg-amber-50/70 dark:bg-amber-950/25',
  },
}

function isSafeExternal(url) {
  return typeof url === 'string' && /^https:\/\//i.test(url)
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false)
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* ignore */
    }
  }
  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition active:scale-[0.97] hover:border-primary-300 hover:text-primary-700 dark:border-border-dark dark:bg-slate-800 dark:text-slate-300 dark:hover:text-primary-300"
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-success" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function ChannelCard({ c, index }) {
  const meta = KIND_META[c.kind] || KIND_META.ngo
  const KindIcon = meta.icon
  const primaryUrl = isSafeExternal(c.donateUrl)
    ? c.donateUrl
    : isSafeExternal(c.url)
      ? c.url
      : null
  const learnMoreUrl = isSafeExternal(c.url) ? c.url : null

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{
        delay: Math.min(index, 8) * 0.045,
        type: 'spring',
        stiffness: 280,
        damping: 26,
      }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition duration-300 hover:border-primary-300 dark:border-border-dark dark:bg-surface-dark-muted dark:hover:border-primary-700"
    >
      <div className={`h-1.5 w-full bg-gradient-to-r ${meta.accent}`} />

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${meta.chip}`}
          >
            <KindIcon className="h-3 w-3" />
            {meta.label}
          </span>
        </div>

        <h3 className="text-lg font-extrabold leading-snug tracking-tight text-slate-900 dark:text-white sm:text-[1.2rem]">
          {c.name}
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          {c.organization}
        </p>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {c.summary}
        </p>

        {c.howTo && (
          <div
            className={`mt-4 rounded-xl border border-border/80 px-3 py-2.5 text-xs leading-relaxed text-slate-600 dark:border-border-dark dark:text-slate-300 ${meta.soft}`}
          >
            <span className="font-bold text-slate-800 dark:text-slate-100">
              Link:{' '}
            </span>
            {c.howTo}
          </div>
        )}

        {(c.upi || c.account) && (
          <div className="mt-4 space-y-2.5 rounded-xl border border-border bg-slate-50/90 p-3 dark:border-border-dark dark:bg-slate-900/50">
            {c.upi && (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    UPI ID
                  </p>
                  <p className="truncate font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {c.upi}
                  </p>
                </div>
                <CopyButton value={c.upi} label="UPI ID" />
              </div>
            )}
            {c.account?.number && (
              <div className="grid gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Account
                    </p>
                    <p className="truncate font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {c.account.number}
                    </p>
                  </div>
                  <CopyButton value={c.account.number} label="account number" />
                </div>
                {c.account.ifsc && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        IFSC
                      </p>
                      <p className="truncate font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {c.account.ifsc}
                      </p>
                    </div>
                    <CopyButton value={c.account.ifsc} label="IFSC" />
                  </div>
                )}
              </div>
            )}
            {c.account?.bank && (
              <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                {c.account.bank}
              </p>
            )}
            {c.paymentSource && (
              <p className="border-t border-border/70 pt-2 text-[10px] leading-snug text-slate-400 dark:border-border-dark dark:text-slate-500">
                {c.paymentSource}
              </p>
            )}
          </div>
        )}

        {c.tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {c.tags.map((t) => (
              <span
                key={t}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 dark:border-border-dark sm:flex-row sm:flex-wrap sm:items-center">
          {primaryUrl && (
            <a
              href={primaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-bold text-white shadow-sm shadow-primary-600/20 transition hover:bg-primary-700 active:scale-[0.98] sm:w-auto"
            >
              <HeartHandshake className="h-4 w-4" />
              Open donate page
              <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
            </a>
          )}
          {learnMoreUrl && learnMoreUrl !== primaryUrl && (
            <a
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700 active:scale-[0.98] dark:border-border-dark dark:bg-surface-dark dark:text-slate-200 sm:w-auto"
            >
              <ExternalLink className="h-4 w-4" />
              More info
            </a>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export default function Donate() {
  const [filter, setFilter] = useState('all')

  const channels = useMemo(() => {
    const rows = donationsData.channels || []
    if (filter === 'all') return rows
    return rows.filter((c) => c.kind === filter)
  }, [filter])

  const counts = useMemo(() => {
    const rows = donationsData.channels || []
    return {
      all: rows.length,
      government: rows.filter((c) => c.kind === 'government').length,
      ngo: rows.filter((c) => c.kind === 'ngo').length,
      creator: rows.filter((c) => c.kind === 'creator').length,
    }
  }, [])

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,_rgba(46,120,134,0.14),_transparent_60%),linear-gradient(180deg,_rgba(238,247,248,0.9),_transparent)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(46,120,134,0.22),_transparent_55%),linear-gradient(180deg,_rgba(15,23,42,0.4),_transparent)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary-200/80 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-700 shadow-sm backdrop-blur dark:border-primary-800 dark:bg-slate-900/60 dark:text-primary-300"
        >
          <HandHeart className="h-3.5 w-3.5" />
          Donate for Assam
        </motion.div>

        <PageHeader
          title="Help flood-affected families"
          subtitle="Links to external donation pages only. We do not collect money, endorse campaigns, or verify how funds are spent."
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-6 grid gap-3 sm:grid-cols-3"
        >
          {[
            {
              title: 'External links only',
              body: 'Each button opens that organisation’s own website. FloodAssist Assam never takes payment.',
            },
            {
              title: 'Assam flood 2026',
              body: 'Only current Assam flood relief campaign pages are listed here — not general national funds.',
            },
            {
              title: 'No false claims',
              body: 'We are not ASDMA, not affiliated with these campaigns, and do not mark any fund as verified by us.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border/80 bg-white/75 p-4 backdrop-blur dark:border-border-dark dark:bg-surface-dark-muted/80"
            >
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {item.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {item.body}
              </p>
            </div>
          ))}
        </motion.div>

        <div className="-mx-4 mb-5 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => {
              const Icon = f.icon
              const active = filter === f.id
              const count = counts[f.id] ?? 0
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition active:scale-[0.97] ${
                    active
                      ? 'border-primary-600 bg-primary-600 text-white shadow-sm shadow-primary-600/25'
                      : 'border-border bg-white text-slate-600 hover:border-primary-300 dark:border-border-dark dark:bg-surface-dark-muted dark:text-slate-300'
                  }`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {f.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
            {donationsData.linksUpdated && (
              <span className="ml-auto hidden shrink-0 text-xs text-slate-400 sm:inline">
                Links updated {donationsData.linksUpdated}
              </span>
            )}
          </div>
        </div>

        {donationsData.note && (
          <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-amber-200/90 bg-amber-50/90 p-3.5 text-xs leading-relaxed text-amber-950 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-100 sm:text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{donationsData.note}</span>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          <motion.div
            key={filter}
            layout
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {channels.map((c, i) => (
              <ChannelCard key={c.id} c={c} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>

        {channels.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-slate-500 dark:border-border-dark">
            No channels in this filter.
          </p>
        )}

        {donationsData.inKindNote && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 rounded-2xl border border-border bg-white p-5 dark:border-border-dark dark:bg-surface-dark-muted sm:p-6"
          >
            <div className="mb-2 inline-flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
              <Info className="h-4 w-4 text-primary-600" />
              Donating supplies instead of money?
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {donationsData.inKindNote}
            </p>
            <div className="mt-4">
              <Button href={telLink('1077')} size="sm" variant="soft">
                <Phone className="h-4 w-4" />
                Call 1077
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
