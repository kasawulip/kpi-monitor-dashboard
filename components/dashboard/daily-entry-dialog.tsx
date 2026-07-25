'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { droContext, type Programme } from '@/lib/dashboard-data'
import { ClipboardPlus, X, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DailyEntryDialogProps {
  open: boolean
  onClose: () => void
  programme: Programme
  dateLabel: string
}

interface FieldState {
  rasDeployed: string
  rasWithEntry: string
  totalCaptured: string
  note: string
}

const empty: FieldState = { rasDeployed: '', rasWithEntry: '', totalCaptured: '', note: '' }

export function DailyEntryDialog({ open, onClose, programme, dateLabel }: DailyEntryDialogProps) {
  const [fields, setFields] = useState<FieldState>(empty)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const headingId = useId()

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  // Reset transient state whenever the dialog is opened.
  useEffect(() => {
    if (open) {
      setFields(empty)
      setSubmitted(false)
      setError(null)
    }
  }, [open])

  if (!open) return null

  function update(key: keyof FieldState, value: string) {
    setFields((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const deployed = Number(fields.rasDeployed)
    const withEntry = Number(fields.rasWithEntry)
    const captured = Number(fields.totalCaptured)
    if (!fields.rasDeployed || !fields.rasWithEntry || !fields.totalCaptured) {
      setError('Please fill in RAs deployed, RAs with entry, and total captured.')
      return
    }
    if (withEntry > deployed) {
      setError('RAs with an entry cannot exceed RAs deployed.')
      return
    }
    if (captured < 0 || deployed < 0 || withEntry < 0) {
      setError('Values cannot be negative.')
      return
    }
    setError(null)
    setSubmitted(true)
  }

  const avgPerRa =
    Number(fields.rasWithEntry) > 0
      ? Math.round(Number(fields.totalCaptured) / Number(fields.rasWithEntry))
      : 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-t-2xl border border-border bg-card shadow-lg sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border p-4 md:p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ClipboardPlus className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id={headingId} className="text-base font-semibold text-foreground">
                Daily data entry
              </h2>
              <p className="text-xs text-muted-foreground">
                {droContext.district} · {dateLabel}
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center md:p-8">
            <span className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="size-8" aria-hidden="true" />
            </span>
            <h3 className="text-lg font-semibold text-foreground">Entry recorded</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              {Number(fields.totalCaptured).toLocaleString()} {programme.unitLabel} logged for{' '}
              {programme.name} across {fields.rasWithEntry} of {fields.rasDeployed} RAs on{' '}
              {dateLabel}.
            </p>
            <div className="mt-2 flex w-full gap-2">
              <button
                type="button"
                onClick={() => {
                  setFields(empty)
                  setSubmitted(false)
                }}
                className="min-h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Add another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 flex-1 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 md:p-5">
            <div className="rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm">
              <span className="text-muted-foreground">Programme: </span>
              <span className="font-medium text-foreground">{programme.name}</span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <NumberField
                label="RAs deployed today"
                value={fields.rasDeployed}
                onChange={(v) => update('rasDeployed', v)}
                placeholder="e.g. 24"
              />
              <NumberField
                label="RAs with an entry"
                value={fields.rasWithEntry}
                onChange={(v) => update('rasWithEntry', v)}
                placeholder="e.g. 20"
              />
              <NumberField
                label={`Total captured (${programme.unitLabel})`}
                value={fields.totalCaptured}
                onChange={(v) => update('totalCaptured', v)}
                placeholder="e.g. 1140"
                className="sm:col-span-2"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="entry-note" className="text-sm font-medium text-foreground">
                Note <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="entry-note"
                value={fields.note}
                onChange={(e) => update('note', e.target.value)}
                rows={2}
                placeholder="Any context on today's numbers (downtime, outreach, etc.)"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            </div>

            {Number(fields.totalCaptured) > 0 && Number(fields.rasWithEntry) > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                Average per reporting RA:{' '}
                <span className="font-mono font-medium text-foreground">{avgPerRa}</span>
              </p>
            )}

            {error && (
              <p role="alert" className="mt-3 text-sm font-medium text-critical">
                {error}
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-11 flex-[1.5] rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Submit entry
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground',
          'font-mono focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        )}
      />
    </div>
  )
}
