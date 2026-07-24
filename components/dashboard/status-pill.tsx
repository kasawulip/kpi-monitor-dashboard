import { cn } from '@/lib/utils'
import { statusMeta, type Status } from '@/lib/dashboard-data'

export function StatusPill({ status, className }: { status: Status; className?: string }) {
  const meta = statusMeta[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.bg,
        meta.text,
        meta.border,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', meta.dot)} aria-hidden="true" />
      {meta.label}
    </span>
  )
}
