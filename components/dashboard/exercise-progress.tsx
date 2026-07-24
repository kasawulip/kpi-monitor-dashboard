import { cn } from '@/lib/utils'
import { statusMeta, type Status } from '@/lib/dashboard-data'
import { StatusPill } from './status-pill'
import { CalendarClock } from 'lucide-react'

export function ExerciseProgress({
  achievement,
  status,
  daysWorked = 0,
  totalDays = 100,
}: {
  achievement: number
  status: Status
  daysWorked?: number
  totalDays?: number
}) {
  const meta = statusMeta[status]
  const elapsed = Math.round((daysWorked / totalDays) * 100)

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground md:text-base">Exercise progress</h2>
        </div>
        <StatusPill status={status} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="font-mono text-2xl font-semibold tabular-nums text-foreground md:text-3xl">
            Day {daysWorked}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">of {totalDays}-day exercise</p>
        </div>
        <div className="text-right">
          <div className={cn('font-mono text-2xl font-semibold tabular-nums md:text-3xl', meta.text)}>
            {achievement}%
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">target achievement</p>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{elapsed}% elapsed</span>
          <span>{totalDays - daysWorked} days remaining</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(elapsed, 2)}%` }} />
        </div>
      </div>

      <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        {status === 'good'
          ? 'Meeting or exceeding the cumulative target — maintain current pace.'
          : status === 'warning'
            ? 'Approaching target but at risk — monitor lagging regions closely.'
            : 'Below cumulative target — intervention recommended in low-performing regions.'}
      </p>
    </section>
  )
}
