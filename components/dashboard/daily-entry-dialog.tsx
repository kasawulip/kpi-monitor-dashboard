'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  droContext,
  getDistrictRas,
  nonWorkingReasons,
  programmes,
  type Programme,
  type ProgrammeId,
} from '@/lib/dashboard-data'
import { ClipboardPlus, X, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DailyEntryDialogProps {
  open: boolean
  onClose: () => void
  programme: Programme
  dateLabel: string
}

type Operated = '' | 'yes' | 'no'

const todayISO = () => new Date().toISOString().slice(0, 10)

export function DailyEntryDialog({ open, onClose, programme }: DailyEntryDialogProps) {
  const [programmeId, setProgrammeId] = useState<ProgrammeId>(programme.id)
  const [date, setDate] = useState<string>(todayISO())
  const [operated, setOperated] = useState<Operated>('')
  const [raId, setRaId] = useState('')
  const [count, setCount] = useState('')
  const [reasonCode, setReasonCode] = useState('')
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

  // Reset the whole form whenever the dialog (re-)opens.
  useEffect(() => {
    if (!open) return
    setProgrammeId(programme.id)
    setDate(todayISO())
    setOperated('')
    setRaId('')
    setCount('')
    setReasonCode('')
    setExplanation('')
    setError(null)
    setSuccess(null)
  }, [open, programme.id])

  // Reset the operate branch whenever programme or date changes.
  useEffect(() => {
    setOperated('')
    setRaId('')
    setReasonCode('')
    setExplanation('')
  }, [programmeId, date])

  const ras = useMemo(
    () => getDistrictRas(programmeId, droContext.region, droContext.district),
    [programmeId],
  )
  const selectedReason = useMemo(
    () => nonWorkingReasons.find((r) => r.code === reasonCode),
    [reasonCode],
  )
  const activeProgramme = programmes.find((p) => p.id === programmeId) ?? programme

  const canSaveEntry =
    operated === 'yes' &&
    !!raId &&
    count !== '' &&
    Number.isInteger(Number(count)) &&
    Number(count) >= 0

  const canSubmitNonWorking =
    operated === 'no' &&
    !!reasonCode &&
    (!selectedReason?.commentRequired || explanation.trim().length > 0)

  if (!open) return null

  function saveEntry() {
    if (!canSaveEntry) {
      setError('Select a Registration Assistant and enter a whole-number output.')
      return
    }
    const ra = ras.find((r) => r.id === raId)
    setError(null)
    setSuccess(
      `Saved. ${Number(count).toLocaleString()} ${activeProgramme.unitLabel} recorded for ${
        ra?.name ?? 'the RA'
      } on ${date}.`,
    )
  }

  function submitNonWorking(forApproval: boolean) {
    if (!canSubmitNonWorking) {
      setError('Select a reason and provide the required explanation.')
      return
    }
    setError(null)
    setSuccess(
      forApproval
        ? `Submitted for approval. Non-working day (${selectedReason?.name}) on ${date} sent to your regional supervisor.`
        : `Draft saved. Non-working day (${selectedReason?.name}) on ${date} stored — submit for approval when ready.`,
    )
  }

  function resetForAnother() {
    setOperated('')
    setRaId('')
    setCount('')
    setReasonCode('')
    setExplanation('')
    setSuccess(null)
    setError(null)
  }

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
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-t-2xl border border-border bg-card shadow-lg sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border p-4 md:p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ClipboardPlus className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Daily data entry
              </p>
              <h2 id={headingId} className="text-base font-semibold text-foreground">
                Enter Registration Assistant output
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {droContext.district} · {droContext.region}
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

        {success ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center md:p-8">
            <span className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="size-8" aria-hidden="true" />
            </span>
            <h3 className="text-lg font-semibold text-foreground">Recorded</h3>
            <p className="max-w-sm text-sm text-muted-foreground">{success}</p>
            <div className="mt-2 flex w-full gap-2">
              <button
                type="button"
                onClick={resetForAnother}
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
          <div className="flex flex-col overflow-y-auto p-4 md:p-5">
            <div className="grid gap-4">
              {/* Programme */}
              <Field label="Programme" required>
                <select
                  value={programmeId}
                  onChange={(e) => setProgrammeId(e.target.value as ProgrammeId)}
                  className={selectClass}
                >
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Date */}
              <Field label="Date" required>
                <input
                  type="date"
                  value={date}
                  max={todayISO()}
                  onChange={(e) => setDate(e.target.value)}
                  className={selectClass}
                />
              </Field>

              {/* Calendar status strip */}
              <CalendarStatusStrip centre={date} programmeId={programmeId} onPick={setDate} />

              {/* Operate toggle */}
              <div className="grid gap-2.5 rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-sm font-medium text-foreground">
                  Did this programme operate in your district on the selected date?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setOperated('yes')}
                    className={cn(
                      'min-h-11 flex-1 basis-52 rounded-lg border px-3.5 text-left text-sm font-semibold transition-colors',
                      operated === 'yes'
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    Yes — enter daily performance
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperated('no')}
                    className={cn(
                      'min-h-11 flex-1 basis-52 rounded-lg border px-3.5 text-left text-sm font-semibold transition-colors',
                      operated === 'no'
                        ? 'border-critical bg-critical/10 text-critical'
                        : 'border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    No — record programme non-working day
                  </button>
                </div>
                {operated === 'no' && (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Use this only where the <span className="font-medium text-foreground">entire
                    programme did not operate</span> in the district. Where some Registration
                    Assistants worked, keep the date as a working day and enter their actual output.
                  </p>
                )}
              </div>

              {/* Yes path */}
              {operated === 'yes' && (
                <>
                  <Field label="Registration Assistant" required>
                    <select
                      value={raId}
                      onChange={(e) => setRaId(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">
                        {ras.length ? 'Select an RA…' : 'No active RAs on this programme'}
                      </option>
                      {ras.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} · {r.code}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label={`Output — whole number (${activeProgramme.unitLabel})`} required>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={count}
                      onChange={(e) => setCount(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 42"
                      className={cn(selectClass, 'font-mono')}
                    />
                  </Field>
                </>
              )}

              {/* No path — non-working day */}
              {operated === 'no' && (
                <>
                  <Field label="Non-working-day reason" required>
                    <select
                      value={reasonCode}
                      onChange={(e) => setReasonCode(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select a reason…</option>
                      {nonWorkingReasons.map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    {selectedReason?.description && (
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        {selectedReason.description}
                      </p>
                    )}
                  </Field>

                  <Field
                    label={
                      selectedReason?.commentRequired
                        ? 'Explanation (required)'
                        : 'Explanation (optional)'
                    }
                    required={!!selectedReason?.commentRequired}
                  >
                    <textarea
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      rows={3}
                      placeholder={
                        selectedReason?.commentRequired
                          ? 'Describe the district-wide disruption in enough detail for the approver to decide.'
                          : 'Add any useful context for the approver.'
                      }
                      className={cn(selectClass, 'resize-y')}
                    />
                  </Field>

                  <div className="rounded-xl border border-warning/40 bg-warning/10 px-3.5 py-3 text-xs leading-relaxed text-foreground">
                    An approved non-working day{' '}
                    <span className="font-semibold">does not reduce the district target</span> or the
                    required operational days. It excludes the date from operational-day counting and
                    may extend the projected completion date.
                  </div>
                </>
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-critical/10 px-3 py-2 text-sm font-medium text-critical"
                >
                  {error}
                </p>
              )}
            </div>

            {/* Footer actions */}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Cancel
              </button>

              {operated === 'no' ? (
                <>
                  <button
                    type="button"
                    onClick={() => submitNonWorking(false)}
                    disabled={!canSubmitNonWorking}
                    className="min-h-11 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save draft
                  </button>
                  <button
                    type="button"
                    onClick={() => submitNonWorking(true)}
                    disabled={!canSubmitNonWorking}
                    className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Submit for approval
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={saveEntry}
                  disabled={!canSaveEntry}
                  className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save entry
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const selectClass =
  'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {required && <span className="text-critical"> *</span>}
      </span>
      {children}
    </label>
  )
}

/* 14-day calendar status strip — status uses colour + glyph + tooltip. */
const STATUS_STYLES: Record<
  string,
  { text: string; bg: string; border: string; glyph: string; label: string }
> = {
  WORKING: {
    text: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/40',
    glyph: '●',
    label: 'Working day',
  },
  MISSING: {
    text: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/40',
    glyph: '?',
    label: 'No submission recorded',
  },
  FUTURE: {
    text: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-border',
    glyph: '→',
    label: 'Future date',
  },
  TODAY: {
    text: 'text-primary',
    bg: 'bg-accent',
    border: 'border-primary/50',
    glyph: '○',
    label: 'Today — awaiting entry',
  },
}

function statusFor(iso: string, today: string): keyof typeof STATUS_STYLES {
  if (iso > today) return 'FUTURE'
  if (iso === today) return 'TODAY'
  // Deterministic past status: mostly working, occasional missing.
  const n = iso.split('-').reduce((s, p) => s + Number(p), 0)
  return n % 7 === 0 ? 'MISSING' : 'WORKING'
}

function CalendarStatusStrip({
  centre,
  onPick,
}: {
  centre: string
  programmeId: ProgrammeId
  onPick: (iso: string) => void
}) {
  const today = todayISO()
  const days: Date[] = []
  const centreDate = new Date(centre + 'T00:00:00')
  for (let i = -6; i <= 7; i += 1) {
    const d = new Date(centreDate)
    d.setDate(centreDate.getDate() + i)
    days.push(d)
  }
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Calendar status">
      {days.map((d) => {
        const iso = d.toISOString().slice(0, 10)
        const status = statusFor(iso, today)
        const st = STATUS_STYLES[status]
        const isSelected = iso === centre
        const disabled = iso > today
        return (
          <button
            key={iso}
            type="button"
            disabled={disabled}
            onClick={() => onPick(iso)}
            title={`${d.toDateString()} — ${st.label}`}
            className={cn(
              'grid min-h-14 min-w-11 flex-1 place-items-center gap-0.5 rounded-lg border px-1 py-1.5 transition-colors',
              st.bg,
              st.text,
              isSelected ? 'border-2 border-foreground' : st.border,
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            )}
          >
            <span className="text-[9px] font-medium uppercase tracking-wide opacity-75">
              {d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3)}
            </span>
            <span className="font-mono text-sm font-bold tabular-nums">{d.getDate()}</span>
            <span className="text-xs leading-none" aria-hidden="true">
              {st.glyph}
            </span>
          </button>
        )
      })}
    </div>
  )
}
