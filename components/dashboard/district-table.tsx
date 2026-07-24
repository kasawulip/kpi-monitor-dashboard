'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { statusMeta, type DistrictRow, type Status } from '@/lib/dashboard-data'
import { StatusPill } from './status-pill'
import { ArrowUpDown, Search } from 'lucide-react'

type SortKey = 'attention' | 'name' | 'output-desc' | 'output-asc'

const sortOptions: { id: SortKey; label: string }[] = [
  { id: 'attention', label: 'Attention (gaps first)' },
  { id: 'name', label: 'District name' },
  { id: 'output-desc', label: 'Output (high → low)' },
  { id: 'output-asc', label: 'Output (low → high)' },
]

const statusFilters: { id: Status | 'all'; label: string }[] = [
  { id: 'all', label: 'All statuses' },
  { id: 'critical', label: 'Critical' },
  { id: 'warning', label: 'At risk' },
  { id: 'good', label: 'On track' },
]

export function DistrictTable({
  districts,
  programmeName,
  totalOutput,
  districtsWithEntries,
  districtsTotal,
}: {
  districts: DistrictRow[]
  programmeName: string
  totalOutput: number
  districtsWithEntries: number
  districtsTotal: number
}) {
  const [sort, setSort] = useState<SortKey>('attention')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    let list = districts
    if (statusFilter !== 'all') list = list.filter((d) => d.status === statusFilter)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((d) => d.district.toLowerCase().includes(q))
    }
    const sorted = [...list]
    switch (sort) {
      case 'name':
        sorted.sort((a, b) => a.district.localeCompare(b.district))
        break
      case 'output-desc':
        sorted.sort((a, b) => b.output - a.output)
        break
      case 'output-asc':
        sorted.sort((a, b) => a.output - b.output)
        break
      default:
        sorted.sort((a, b) => a.achievement - b.achievement)
    }
    return sorted
  }, [districts, sort, statusFilter, query])

  const avgPerDistrict = districtsTotal ? Math.round((totalOutput / districtsTotal) * 10) / 10 : 0

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-4 md:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground md:text-base">District detail</h2>
          <span className="text-xs text-muted-foreground">{programmeName}</span>
        </div>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat label="Total output" value={totalOutput.toLocaleString()} />
          <SummaryStat label="Avg / district" value={avgPerDistrict.toLocaleString()} />
          <SummaryStat label="With entries" value={`${districtsWithEntries} / ${districtsTotal}`} />
          <SummaryStat label="No entries" value={(districtsTotal - districtsWithEntries).toLocaleString()} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 border-b border-border p-4 md:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search districts…"
            aria-label="Search districts"
            className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
            {statusFilters.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={statusFilter === f.id}
                onClick={() => setStatusFilter(f.id)}
                className={cn(
                  'inline-flex min-h-9 items-center rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  statusFilter === f.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <select
              aria-label="Sort districts"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 appearance-none rounded-lg border border-border bg-background pl-8 pr-8 text-xs font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {sortOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-5 py-3 font-medium">District</th>
              <th scope="col" className="px-5 py-3 font-medium">Region</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Output</th>
              <th scope="col" className="px-5 py-3 font-medium">Achievement</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">RAs reporting</th>
              <th scope="col" className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const meta = statusMeta[d.status]
              return (
                <tr key={d.district} className="border-b border-border/60 last:border-0 hover:bg-accent/30">
                  <td className="px-5 py-3 font-medium text-foreground">{d.district}</td>
                  <td className="px-5 py-3 text-muted-foreground">{d.region.replace(' Region', '')}</td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums text-foreground">
                    {d.output.toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div className={cn('h-full rounded-full', meta.dot)} style={{ width: `${Math.min(100, d.achievement)}%` }} />
                      </div>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">{d.achievement}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums text-muted-foreground">
                    {d.rasReporting} / {d.rasTotal}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={d.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-border/60 md:hidden">
        {rows.map((d) => {
          const meta = statusMeta[d.status]
          return (
            <li key={d.district} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{d.district}</p>
                  <p className="text-xs text-muted-foreground">{d.region.replace(' Region', '')}</p>
                </div>
                <StatusPill status={d.status} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={cn('h-full rounded-full', meta.dot)} style={{ width: `${Math.min(100, d.achievement)}%` }} />
                </div>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">{d.achievement}%</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Output <span className="font-mono font-medium text-foreground">{d.output.toLocaleString()}</span>
                </span>
                <span>
                  RAs <span className="font-mono font-medium text-foreground">{d.rasReporting} / {d.rasTotal}</span>
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      {rows.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          No districts match the current filters.
        </p>
      )}
    </section>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="font-mono text-lg font-semibold tabular-nums text-foreground">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}
