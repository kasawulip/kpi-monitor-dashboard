'use client'

import { cn } from '@/lib/utils'
import {
  dateRanges,
  programmes,
  regionNames,
  type DateRange,
  type ProgrammeId,
} from '@/lib/dashboard-data'
import { ChevronDown, MapPin, Layers } from 'lucide-react'

interface FilterBarProps {
  programme: ProgrammeId
  region: string | null
  range: DateRange['id']
  onProgramme: (id: ProgrammeId) => void
  onRegion: (region: string | null) => void
  onRange: (range: DateRange['id']) => void
}

export function FilterBar({
  programme,
  region,
  range,
  onProgramme,
  onRegion,
  onRange,
}: FilterBarProps) {
  return (
    <section
      aria-label="Dashboard filters"
      className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5"
    >
      {/* Programme */}
      <div className="flex items-center gap-2">
        <Layers className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Programme
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2" role="group" aria-label="Select programme">
        {programmes.map((p) => {
          const active = p.id === programme
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => onProgramme(p.id)}
              className={cn(
                'inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {p.name}
            </button>
          )
        })}
      </div>

      <div className="mt-4 h-px bg-border" />

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Geographic scope */}
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Geographic scope
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={region === null}
              onClick={() => onRegion(null)}
              className={cn(
                'inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                region === null
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              National
            </button>
            <div className="relative flex-1 min-w-[10rem]">
              <select
                aria-label="Select region"
                value={region ?? ''}
                onChange={(e) => onRegion(e.target.value || null)}
                className="h-11 w-full appearance-none rounded-xl border border-border bg-background pl-4 pr-10 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <option value="">All regions…</option>
                {regionNames.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* Date range */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Reporting period
          </span>
          <div
            className="mt-2.5 flex flex-wrap gap-2"
            role="group"
            aria-label="Select reporting period"
          >
            {dateRanges.map((d) => {
              const active = d.id === range
              return (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onRange(d.id)}
                  className={cn(
                    'inline-flex min-h-11 items-center rounded-xl border px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    active
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {d.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
