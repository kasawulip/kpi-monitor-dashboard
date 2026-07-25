'use client'

import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import {
  getDashboardData,
  getNationalStats,
  getProgrammeSummaries,
  statusMeta,
  fmtNumber,
  type ProgrammeId,
} from '@/lib/dashboard-data'
import { cn } from '@/lib/utils'
import { ProgrammeOverview } from '@/components/dashboard/programme-overview'
import { RegionalPerformance } from '@/components/dashboard/regional-performance'
import { DistrictSnapshot } from '@/components/dashboard/district-snapshot'
import { StatusPill } from '@/components/dashboard/status-pill'
import { PageHeader, btnGhost } from '../ui'

export function AdminOverview({ onNavigateProgrammes }: { onNavigateProgrammes: () => void }) {
  const [programme, setProgramme] = useState<ProgrammeId>('nid-registration')
  const stats = useMemo(() => getNationalStats(), [])
  const summaries = useMemo(() => getProgrammeSummaries(), [])
  const data = useMemo(() => getDashboardData(programme, null, 'exercise'), [programme])
  const meta = statusMeta[stats.status]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="National Operations Centre"
        title="Exercise overview"
        description="Live national performance across all programmes for the 100-Day Performance Exercise. Select a programme to drill into regional detail."
        action={
          <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm">
            <span className={cn('size-1.5 rounded-full', meta.dot)} aria-hidden="true" />
            Exercise active · all programmes reporting
          </span>
        }
      />

      {/* Programme overview band */}
      <ProgrammeOverview
        summaries={summaries}
        active={programme}
        onSelect={setProgramme}
        heading="Programme overview"
        scopeNote="Cumulative · National"
      />

      {/* Drill-down */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wide">Viewing</span>
              <ChevronRight className="size-3.5" aria-hidden="true" />
              <span className="font-medium text-foreground">{data.programme.name}</span>
              <StatusPill status={data.nationalStatus} className="ml-1" />
            </div>
            <button type="button" onClick={onNavigateProgrammes} className={cn(btnGhost, 'h-8 px-3 text-xs')}>
              Configure targets
            </button>
          </div>
          <RegionalPerformance regions={data.regions} programmeName={data.programme.name} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
          <h2 className="text-sm font-semibold text-foreground md:text-base">Programme standings</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Cumulative achievement by programme</p>
          <ol className="mt-4 flex flex-col gap-3">
            {[...summaries]
              .sort((a, b) => b.achievement - a.achievement)
              .map((s, i) => {
                const sMeta = statusMeta[s.status]
                return (
                  <li key={s.id} className="rounded-xl border border-transparent p-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-xs font-semibold text-muted-foreground">
                          {i + 1}
                        </span>
                        <span className="truncate text-sm font-medium text-foreground">{s.name}</span>
                      </div>
                      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                        {s.achievement}%
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 pl-8">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn('h-full rounded-full', sMeta.dot)}
                          style={{ width: `${Math.min(100, s.achievement)}%` }}
                        />
                      </div>
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                        {fmtNumber(s.achieved)} / {fmtNumber(s.target)}
                      </span>
                    </div>
                  </li>
                )
              })}
          </ol>
        </div>
      </div>

      {/* District daily output */}
      <div>
        <div className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wide">District daily output</span>
        </div>
        <DistrictSnapshot defaultProgramme={programme} />
      </div>
    </div>
  )
}
