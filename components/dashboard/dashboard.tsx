'use client'

import { useMemo, useState } from 'react'
import {
  getDashboardData,
  type DateRange,
  type ProgrammeId,
} from '@/lib/dashboard-data'
import { SiteHeader } from './site-header'
import { FilterBar } from './filter-bar'
import { KpiGrid } from './kpi-grid'
import { RegionalPerformance } from './regional-performance'
import { Heatmap } from './heatmap'
import { DistrictSnapshot } from './district-snapshot'
import { statusMeta } from '@/lib/dashboard-data'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const [programme, setProgramme] = useState<ProgrammeId>('card-issuance')
  const [region, setRegion] = useState<string | null>(null)
  const [range, setRange] = useState<DateRange['id']>('today')

  const data = useMemo(
    () => getDashboardData(programme, region, range),
    [programme, region, range],
  )

  const meta = statusMeta[data.nationalStatus]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-7">
        {/* Scope summary */}
        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h2 className="text-lg font-semibold text-foreground md:text-xl">
            National &amp; Regional Performance Snapshot
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {data.programme.name}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {data.scopeLabel}
          </span>
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', meta.text)}>
            <span className={cn('size-1.5 rounded-full', meta.dot)} aria-hidden="true" />
            All programmes reporting
          </span>
        </div>

        <FilterBar
          programme={programme}
          region={region}
          range={range}
          onProgramme={setProgramme}
          onRegion={setRegion}
          onRange={setRange}
        />

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
