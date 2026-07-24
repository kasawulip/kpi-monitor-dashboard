'use client'

import { useMemo, useState } from 'react'
import {
  getDashboardData,
  getProgrammeSummaries,
  type DateRange,
  type ProgrammeId,
} from '@/lib/dashboard-data'
import { SiteHeader } from './site-header'
import { StatusBanner } from './status-banner'
import { ProgrammeOverview } from './programme-overview'
import { FilterBar } from './filter-bar'
import { KpiGrid } from './kpi-grid'
import { RegionalPerformance } from './regional-performance'
import { Heatmap } from './heatmap'
import { DistrictSnapshot } from './district-snapshot'
import { statusMeta } from '@/lib/dashboard-data'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const [programme, setProgramme] = useState<ProgrammeId>('card-issuance')
  const [region, setRegion] = useState<string | null>(null)
  // Results are always cumulative: from the start of the exercise through today.
  const range: DateRange['id'] = 'exercise'

  const data = useMemo(
    () => getDashboardData(programme, region, range),
    [programme, region, range],
  )

  const summaries = useMemo(() => getProgrammeSummaries(), [])

  const meta = statusMeta[data.nationalStatus]

  function handleSelectProgramme(id: ProgrammeId) {
    setProgramme(id)
    setRegion(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-7">
        {/* System health */}
        <StatusBanner />

        {/* Multi-programme overview */}
        <div className="mt-5">
          <ProgrammeOverview
            summaries={summaries}
            active={programme}
            onSelect={handleSelectProgramme}
          />
        </div>

        {/* Currently viewing breadcrumb */}
        <div className="mt-6 border-t border-border pt-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h2 className="text-lg font-semibold text-foreground md:text-xl">
              National &amp; Regional Performance Snapshot
            </h2>
            <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', meta.text)}>
              <span className={cn('size-1.5 rounded-full', meta.dot)} aria-hidden="true" />
              {meta.label}
            </span>
          </div>
          <nav
            aria-label="Current scope"
            className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
          >
            <span className="text-xs font-semibold uppercase tracking-wide">Currently viewing</span>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <span className="font-medium text-foreground">{data.programme.name}</span>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <span className="font-medium text-foreground">{data.scopeLabel}</span>
          </nav>
        </div>

        <div className="mt-4">
          <FilterBar
            programme={programme}
            region={region}
            onProgramme={setProgramme}
            onRegion={setRegion}
          />
        </div>

        {/* KPIs */}
        <div className="mt-5">
          <KpiGrid kpis={data.kpis} />
        </div>

        {/* Regional + heatmap */}
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <RegionalPerformance
            regions={data.regions}
            programmeName={data.programme.name}
            onSelectRegion={region ? undefined : (r) => setRegion(r)}
          />
          <Heatmap regions={data.regions} programmeName={data.programme.name} />
        </div>

        {/* Region → district → programme → date drill-down */}
        <div className="mt-5">
          <DistrictSnapshot defaultProgramme={programme} />
        </div>

        <footer className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          <p>Aggregate figures are illustrative placeholders for a pilot prototype.</p>
        </footer>
      </main>
    </div>
  )
}
