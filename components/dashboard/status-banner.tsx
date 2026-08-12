import { CheckCircle2 } from 'lucide-react'

export function StatusBanner() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-success/30 bg-success-muted px-3.5 py-2.5">
      <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
      <p className="text-sm text-foreground">
        <span className="font-semibold text-success">Exercise Status: Active</span>
        <span className="text-muted-foreground"> — all programmes reporting normally.</span>
      </p>
    </div>
  )
}
