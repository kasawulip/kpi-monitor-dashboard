import { Wrench } from 'lucide-react'
import { PageHeader } from '../ui'

export function PlaceholderSection({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Wrench className="size-6" aria-hidden="true" />
        </span>
        <p className="text-sm font-medium text-foreground">Section available in the full build</p>
        <p className="max-w-md text-sm text-muted-foreground">
          This area is part of the PRO-IS panel and is navigable here. The interactive workflow is
          scoped out of this prototype pass, which focuses on the Overview and key administration
          screens.
        </p>
      </div>
    </div>
  )
}
