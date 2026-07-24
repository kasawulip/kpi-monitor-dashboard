import { cn } from '@/lib/utils'
import { statusMeta, type RegionPerf, type Status } from '@/lib/dashboard-data'

function statusFor(pct: number): Status {
  if (pct >= 80) return 'good'
  if (pct >= 50) return 'warning'
  return 'critical'
}

export function RegionalPerformance({
  regions,
  programmeName,
  onSelectRegion,
}: {
  regions: RegionPerf[]
  programmeName: string
  onSelectRegion?: (region: string) => void
}) {
  const ranked = [...regions].sort((a, b) => b.achievement - a.achievement)

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground md:text-base">Regional performance</h2>
        <span className="text-xs text-muted-foreground">{programmeName}</span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">Ranked by achievement vs. target</p>

      <ol className="mt-4 flex flex-col gap-3">
        {ranked.map((r, i) => {
          const meta = statusMeta[statusFor(r.achievement)]
          const Row = onSelectRegion ? 'button' : 'div'
          return (
            <li key={r.name}>
              <Row
                type={onSelectRegion ? 'button' : undefined}
                onClick={onSelectRegion ? () => onSelectRegion(r.name) : undefined}
                className={cn(
                  'w-full rounded-xl border border-transparent p-2 text-left transition-colors',
                  onSelectRegion && 'hover:border-border hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">{r.name}</span>
                  </div>
                  <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                    {r.achievement}%
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3 pl-8">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full', meta.dot)}
                      style={{ width: `${Math.min(100, r.achievement)}%` }}
                    />
                  </div>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {r.achieved.toLocaleString()} / {r.target.toLocaleString()}
                  </span>
                </div>
              </Row>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
