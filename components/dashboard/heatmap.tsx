import { cn } from '@/lib/utils'
import type { RegionPerf } from '@/lib/dashboard-data'

function tone(pct: number) {
  // Map achievement to a background/text pair using semantic status tokens.
  if (pct >= 80) return 'bg-success text-success-foreground'
  if (pct >= 60) return 'bg-success/70 text-success-foreground'
  if (pct >= 45) return 'bg-warning text-warning-foreground'
  if (pct >= 30) return 'bg-warning/70 text-warning-foreground'
  if (pct >= 20) return 'bg-critical/80 text-critical-foreground'
  return 'bg-critical text-critical-foreground'
}

export function Heatmap({ regions, programmeName }: { regions: RegionPerf[]; programmeName: string }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground md:text-base">Regional heat map</h2>
        <span className="text-xs text-muted-foreground">{programmeName}</span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">Colour-coded by achievement %</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {regions.map((r) => (
          <div
            key={r.name}
            className={cn(
              'flex aspect-[4/3] flex-col items-center justify-center rounded-xl p-2 text-center',
              tone(r.achievement),
            )}
          >
            <span className="font-mono text-lg font-semibold tabular-nums leading-none md:text-xl">
              {Math.round(r.achievement)}%
            </span>
            <span className="mt-1 line-clamp-2 text-[10px] font-medium leading-tight opacity-90 md:text-[11px]">
              {r.short}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-critical" aria-hidden="true" /> Below 45%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-warning" aria-hidden="true" /> 45–79%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-success" aria-hidden="true" /> 80%+
        </span>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Rendered as a colour-coded grid rather than a geographic outline, so it stays lightweight and accurate on field devices.
      </p>
    </section>
  )
}
