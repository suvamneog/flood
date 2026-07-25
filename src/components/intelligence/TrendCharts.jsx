import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { buildTrendSeries, formatIndianNumber } from '../../utils/intelligence'
import EmptyState from '../ui/EmptyState'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 text-sm shadow-lg dark:border-border-dark dark:bg-slate-900">
      <p className="mb-1 font-semibold text-slate-900 dark:text-white">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-slate-600 dark:text-slate-300">
          {p.name}:{' '}
          <span className="font-bold text-slate-900 dark:text-white">
            {formatIndianNumber(p.value)}
          </span>
        </p>
      ))}
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm dark:border-border-dark dark:bg-surface-dark-muted sm:p-5">
      <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      <div className="h-56 w-full">{children}</div>
    </div>
  )
}

export default function TrendCharts({ historyReports }) {
  const series = buildTrendSeries(historyReports)

  if (series.length < 2) {
    return (
      <EmptyState
        title="Not enough history for charts"
        description="Import at least two daily ASDMA reports to unlock trend charts. Try npm run scrape:pdf -- --seed-history 5"
      />
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Trend Charts
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Official ASDMA figures across imported report days
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Affected Population over time">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="popFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatIndianNumber(v)} width={56} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="peopleAffected"
                name="Population"
                stroke="#2563EB"
                fill="url(#popFill)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Relief Camps over time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="reliefCamps"
                name="Camps"
                stroke="#F97316"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Affected Districts over time">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="distFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={32} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="floodedDistricts"
                name="Districts"
                stroke="#EF4444"
                fill="url(#distFill)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="River Warning Count">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={32} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="riverWarnings"
                name="Warnings"
                stroke="#0EA5E9"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
