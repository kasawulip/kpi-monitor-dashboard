'use client'

import { useMemo, useState } from 'react'
import {
  droContext,
  getDistrictSummary,
  getDistrictProgrammeSummaries,
  statusMeta,
  type ProgrammeId,
} from '@/lib/dashboard-data'
import { SiteHeader } from './site-header'
import { StatusBanner } from './status-banner'
import { ProgrammeOverview } from './programme-overview'
import { KpiGrid } from './kpi-grid'
import { DistrictSnapshot } from './district-snapshot'
import { DailyEntryDialog } from './daily-entry-dialog'
import { ChevronRight, MapPin, Building2, ClipboardPlus, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const [programme, setProgramme] = useState<ProgrammeId>('nid-registration')
  const [entryOpen, setEntryOpen] = useState(false)

  const data = useMemo(
    () => getDistrictSummary(programme, droContext.region, droContext.district),
    [programme],
  )
  const summaries = useMemo(
    () => getDistrictProgrammeSummaries(droContext.region, droContext.district),
    [],
  )
  const meta = statusMeta[data.status]

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader
        user={{ name: droContext.officerName, role: droContext.role, scope: droContext.district }}
      />

      <main className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-7">
        {/* System health */}
        <StatusBanner />

        {/* Assigned-district identity band */}
        <div className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Building2 className="size-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  My assigned district
                </p>
                <h2 className="text-xl font-semibold leading-tight text-foreground md:text-2xl">
                  {droContext.district}
                </h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {droContext.region}
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-xs">{droContext.officeCode}</span>
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Lock className="size-3.5" aria-hidden="true" />
              Scope locked to your district
            </span>
          </div>
        </div>

        {/* Per-programme district summaries (doubles as programme selector) */}
        <div className="mt-5">
          <ProgrammeOverview
            summaries={summaries}
            active={programme}
            onSelect={setProgramme}
            heading="My district by programme"
            scopeNote={`Cumulative · ${droContext.district}`}
          />
        </div>

        {/* Currently viewing breadcrumb */}
        <div className="mt-6 border-t border-border pt-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h2 className="text-lg font-semibold text-foreground md:text-xl">
              District performance snapshot
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
            <span className="font-medium text-foreground">{droContext.district}</span>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <span className="font-medium text-foreground">{data.programme.name}</span>
          </nav>
          <p className="mt-2 text-xs text-muted-foreground">
            Figures are cumulative from the start of the exercise through today, {today}.
          </p>
        </div>

        {/* District KPIs */}
        <div className="mt-4">
          <KpiGrid kpis={data.kpis} />
        </div>

        {/* Daily data entry — DRO-exclusive action */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ClipboardPlus className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Submit today&apos;s daily entry</p>
              <p className="text-xs text-muted-foreground">
                Record {data.programme.name} output for {droContext.district} · {today}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEntryOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ClipboardPlus className="size-4" aria-hidden="true" />
            New entry
          </button>
        </div>

        {/* District daily snapshot — locked to the DRO's district */}
        <div className="mt-5">
          <DistrictSnapshot
            defaultProgramme={programme}
            lockedRegion={droContext.region}
            lockedDistrict={droContext.district}
          />
        </div>

        <footer className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          <p>
            District Registration Officer view. Figures are illustrative placeholders for a pilot
            prototype.
          </p>
        </footer>
      </main>

      <DailyEntryDialog
        open={entryOpen}
        onClose={() => setEntryOpen(false)}
        programme={data.programme}
        dateLabel={today}
      />
    </div>
  )
}
