import { cn } from '@/lib/utils'
import { statusMeta, type Kpi } from '@/lib/dashboard-data'
import { StatusPill } from './status-pill'

export function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      {kpis.map((kpi) => {
        const meta = kpi.status ? statusMeta[kpi.status] : null
        return (
          <div
            key={kpi.key}
            className={cn(
              'relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5',
              kpi.emphasis && 'col-span-2 md:col-span-1',
            )}
          >
            {meta && (
              <span
                className={cn('absolute inset-x-0 top-0 h-1', meta.dot)}
                aria-hidden="true"
              />
            )}
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground md:text-sm">{kpi.label}</p>
              {kpi.status && <StatusPill status={kpi.status} />}
            </div>
            <div className="mt-2">
              <div
                className={cn(
                  'font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground md:text-3xl',
                  kpi.emphasis && 'md:text-4xl',
                )}
              >
                {kpi.value}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{kpi.caption}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
