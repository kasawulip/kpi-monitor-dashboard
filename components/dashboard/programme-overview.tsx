'use client'

import { cn } from '@/lib/utils'
import { statusMeta, type ProgrammeId, type ProgrammeSummary } from '@/lib/dashboard-data'
import { StatusPill } from './status-pill'
import { CreditCard, IdCard, FileText, ChevronRight } from 'lucide-react'

const programmeIcon: Record<ProgrammeId, typeof CreditCard> = {
  'card-issuance': CreditCard,
  'nid-registration': IdCard,
  opencrvs: FileText,
}

function fmt(n: number) {
  return n.toLocaleString('en-US')
}

interface ProgrammeOverviewProps {
  summaries: ProgrammeSummary[]
  active: ProgrammeId
  onSelect: (id: ProgrammeId) => void
  heading?: string
  scopeNote?: string
}

export function ProgrammeOverview({
  summaries,
  active,
  onSelect,
  heading = 'Programme overview',
  scopeNote = 'Cumulative · National',
}: ProgrammeOverviewProps) {
  return (
    <section aria-labelledby="programme-overview-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          id="programme-overview-heading"
          className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {heading}
        </h2>
        <span className="text-xs text-muted-foreground">{scopeNote}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaries.map((s) => {
          const Icon = programmeIcon[s.id]
          const meta = statusMeta[s.status]
          const isActive = s.id === active
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              aria-pressed={isActive}
              className={cn(
                'group flex flex-col rounded-2xl border bg-card p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                isActive
                  ? 'border-primary ring-1 ring-primary shadow-sm'
                  : 'border-border hover:border-primary/40 hover:shadow-sm',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-xl',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-accent-foreground',
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.activeRas} active RAs</p>
                  </div>
                </div>
                <StatusPill status={s.status} />
              </div>

              <div className="mt-4 flex items-end justify-between gap-2">
                <div>
                  <p className={cn('font-mono text-3xl font-bold leading-none tabular-nums', meta.text)}>
                    {s.achievement}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">target achievement</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                    {fmt(s.achieved)}
                  </p>
                  <p className="text-xs text-muted-foreground">of {fmt(s.target)}</p>
                </div>
              </div>

              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full transition-all', meta.dot)}
                    style={{ width: `${Math.min(100, s.achievement)}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground">
                {isActive ? 'Viewing this programme' : 'View details'}
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
