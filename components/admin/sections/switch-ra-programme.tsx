'use client'

import { useMemo, useState } from 'react'
import { ArrowLeftRight, MapPin, Building2, UserCircle, Info, CheckCircle2 } from 'lucide-react'
import {
  regionNames,
  districtsByRegion,
  programmes,
  getDistrictRas,
  type ProgrammeId,
} from '@/lib/dashboard-data'
import { cn } from '@/lib/utils'
import { useToast } from '../toast'
import { AdminDialog } from '../admin-dialog'
import { Field, PageHeader, Tag, inputClass, btnPrimary, btnGhost } from '../ui'

/* -------------------------------------------------------------------------- *
 * Switch RA Programme — PRO-IS moves an existing RA from one programme to
 * another within the SAME district & region. District/region are never
 * editable here. All authoritative persistence + KPI recalculation is the
 * backend's responsibility (see the frontend/backend contract in the report).
 *
 * The impact preview is an ESTIMATE computed with the same seeded target math
 * the rest of the prototype uses (roster size × programme.targetPerRaDay); the
 * backend remains the source of truth and confirms real figures on submit.
 * -------------------------------------------------------------------------- */

const today = '2026-06-30'

/** first.last username preview (display only; backend confirms final value). */
function usernameFor(name: string) {
  const parts = name.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return parts[0] ?? ''
  return `${parts[0]}.${parts[parts.length - 1]}`.replace(/[^a-z0-9.]+/g, '')
}

/** Adds n days to an ISO (YYYY-MM-DD) date, returning ISO. */
function isoAddDays(iso: string, n: number) {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0, 10)
}

function prettyDate(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

interface ProgrammeImpact {
  countBefore: number
  countAfter: number
  targetBefore: number
  targetAfter: number
}

interface SwitchPreview {
  raName: string
  raCode: string
  district: string
  region: string
  outgoingName: string
  receivingName: string
  effectiveDate: string
  outgoingEndDate: string
  outgoing: ProgrammeImpact
  receiving: ProgrammeImpact
}

export function SwitchRaProgrammeSection() {
  const { notify } = useToast()

  const [region, setRegion] = useState('')
  const [district, setDistrict] = useState('')
  const [currentProgramme, setCurrentProgramme] = useState<ProgrammeId | ''>('')
  const [raId, setRaId] = useState('')
  const [receivingProgramme, setReceivingProgramme] = useState<ProgrammeId | ''>('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [reason, setReason] = useState('')

  const [preview, setPreview] = useState<SwitchPreview | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState<SwitchPreview | null>(null)

  const districtOptions = region ? districtsByRegion[region] ?? [] : []

  // Roster currently associated with region + district + current programme.
  const roster = useMemo(() => {
    if (!region || !district || !currentProgramme) return []
    return getDistrictRas(currentProgramme, region, district)
  }, [region, district, currentProgramme])

  const selectedRa = roster.find((r) => r.id === raId)

  // Receiving programme options exclude the current programme entirely.
  const receivingOptions = programmes.filter((p) => p.id !== currentProgramme)

  const outgoingProg = programmes.find((p) => p.id === currentProgramme)
  const receivingProg = programmes.find((p) => p.id === receivingProgramme)

  /* ---- cascading resets (spec §5) --------------------------------------- */
  function changeRegion(v: string) {
    setRegion(v)
    setDistrict('')
    setCurrentProgramme('')
    setRaId('')
    setReceivingProgramme('')
    setEffectiveDate('')
    setPreview(null)
  }
  function changeDistrict(v: string) {
    setDistrict(v)
    setCurrentProgramme('')
    setRaId('')
    setReceivingProgramme('')
    setEffectiveDate('')
    setPreview(null)
  }
  function changeCurrentProgramme(v: ProgrammeId | '') {
    setCurrentProgramme(v)
    setRaId('')
    setReceivingProgramme('')
    setPreview(null)
  }
  function changeRa(v: string) {
    setRaId(v)
    setPreview(null)
  }
  function changeReceiving(v: ProgrammeId | '') {
    setReceivingProgramme(v)
    setPreview(null) // invalidate stale preview
  }
  function changeEffectiveDate(v: string) {
    setEffectiveDate(v)
    setPreview(null) // invalidate stale preview
  }

  /* ---- client-side validation (spec §7) --------------------------------- */
  const sameProgramme = Boolean(
    currentProgramme && receivingProgramme && currentProgramme === receivingProgramme,
  )
  const selectionsValid =
    Boolean(region && district && currentProgramme && raId && receivingProgramme && effectiveDate) &&
    !sameProgramme &&
    Boolean(selectedRa)

  const outgoingEndDate = effectiveDate ? isoAddDays(effectiveDate, -1) : ''

  /* ---- preview boundary (spec §9 / §15A) -------------------------------- *
   * In production this calls: POST /pro-is/ra-programme-switches/preview
   * Here it derives an ESTIMATE from the prototype's seeded roster + target
   * math so the UX is demonstrable without inventing a divergent formula.   */
  function generatePreview() {
    if (!selectionsValid || !selectedRa || !outgoingProg || !receivingProg) return
    const receivingRoster = getDistrictRas(receivingProgramme as ProgrammeId, region, district)

    const outCountBefore = roster.length
    const outCountAfter = Math.max(0, outCountBefore - 1)
    const recvCountBefore = receivingRoster.length
    const recvCountAfter = recvCountBefore + 1

    const next: SwitchPreview = {
      raName: selectedRa.name,
      raCode: selectedRa.code,
      district,
      region,
      outgoingName: outgoingProg.name,
      receivingName: receivingProg.name,
      effectiveDate,
      outgoingEndDate,
      outgoing: {
        countBefore: outCountBefore,
        countAfter: outCountAfter,
        targetBefore: outCountBefore * outgoingProg.targetPerRaDay,
        targetAfter: outCountAfter * outgoingProg.targetPerRaDay,
      },
      receiving: {
        countBefore: recvCountBefore,
        countAfter: recvCountAfter,
        targetBefore: recvCountBefore * receivingProg.targetPerRaDay,
        targetAfter: recvCountAfter * receivingProg.targetPerRaDay,
      },
    }
    setPreview(next)
    notify('Impact preview generated. Review before confirming the switch.', 'success')
  }

  /* ---- confirm boundary (spec §11-§13 / §15B) --------------------------- *
   * In production this calls: POST /pro-is/ra-programme-switches            */
  async function confirmSwitch() {
    if (!preview) return
    setSubmitting(true)
    // Simulated request round-trip. Emergent implements the authoritative op.
    await new Promise((r) => setTimeout(r, 650))
    setSubmitting(false)
    setConfirmOpen(false)
    setCompleted(preview)
    notify(
      `Programme switch completed. ${preview.raName} is assigned to ${preview.receivingName} effective ${prettyDate(preview.effectiveDate)}.`,
      'success',
    )
  }

  function resetForNext() {
    setCompleted(null)
    setRaId('')
    setReceivingProgramme('')
    setEffectiveDate('')
    setReason('')
    setPreview(null)
  }

  const raUsername = selectedRa ? usernameFor(selectedRa.name) : ''

  /* ---- success summary --------------------------------------------------- */
  if (completed) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="RA Management"
          title="Switch RA Programme"
          description="The programme switch was completed. Historical entries remain attributed to the assignments that produced them."
        />
        <div className="mx-auto max-w-2xl rounded-2xl border border-success/30 bg-success-muted/40 p-6 text-center shadow-sm">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-lg font-semibold text-foreground">Programme switch completed</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {completed.raName} ({completed.raCode}) is assigned to{' '}
            <strong className="text-foreground">{completed.receivingName}</strong> effective{' '}
            {prettyDate(completed.effectiveDate)}. Historical programme assignments and entries have
            been preserved.
          </p>
          <dl className="mx-auto mt-4 grid max-w-md gap-x-6 gap-y-2 text-left text-sm sm:grid-cols-2">
            <Row label="District" value={completed.district} />
            <Row label="Region" value={completed.region} />
            <Row label="Former programme" value={completed.outgoingName} />
            <Row label="Receiving programme" value={completed.receivingName} />
            <Row label="Former assignment ends" value={prettyDate(completed.outgoingEndDate)} />
            <Row label="New assignment begins" value={prettyDate(completed.effectiveDate)} />
          </dl>
          <div className="mt-6 flex justify-center gap-2">
            <button type="button" onClick={resetForNext} className={btnPrimary}>
              Switch another RA
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="RA Management"
        title="Switch RA Programme"
        description="Move an existing Registration Assistant from one programme to another within the same district and region. This changes the RA's programme assignment only — it does not create a new RA or change their identity, district or region."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <div className="space-y-5 lg:col-span-3">
          {/* Scope + selection */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">Select the RA to switch</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Region and district stay fixed for this operation.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Field label="Region">
                <select
                  value={region}
                  onChange={(e) => changeRegion(e.target.value)}
                  className={inputClass}
                  aria-label="Region"
                >
                  <option value="">Select region</option>
                  {regionNames.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="District">
                <select
                  value={district}
                  onChange={(e) => changeDistrict(e.target.value)}
                  disabled={!region}
                  className={cn(inputClass, !region && 'cursor-not-allowed opacity-50')}
                  aria-label="District"
                >
                  <option value="">{region ? 'Select district' : 'Pick region first'}</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Current programme">
                <select
                  value={currentProgramme}
                  onChange={(e) => changeCurrentProgramme(e.target.value as ProgrammeId)}
                  disabled={!district}
                  className={cn(inputClass, !district && 'cursor-not-allowed opacity-50')}
                  aria-label="Current programme"
                >
                  <option value="">{district ? 'Select programme' : 'Pick district first'}</option>
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Registration Assistant">
                <select
                  value={raId}
                  onChange={(e) => changeRa(e.target.value)}
                  disabled={!currentProgramme || roster.length === 0}
                  className={cn(
                    inputClass,
                    (!currentProgramme || roster.length === 0) && 'cursor-not-allowed opacity-50',
                  )}
                  aria-label="Registration Assistant"
                >
                  <option value="">
                    {!currentProgramme
                      ? 'Pick current programme first'
                      : roster.length === 0
                        ? 'No active RAs in this scope'
                        : `Select RA (${roster.length} available)`}
                  </option>
                  {roster.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} · {r.code}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* Switch target */}
          <div
            className={cn(
              'rounded-2xl border border-border bg-card p-5 shadow-sm transition-opacity',
              !selectedRa && 'pointer-events-none opacity-50',
            )}
            aria-disabled={!selectedRa}
          >
            <h2 className="text-sm font-semibold text-foreground">Switch details</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Receiving programme">
                <select
                  value={receivingProgramme}
                  onChange={(e) => changeReceiving(e.target.value as ProgrammeId)}
                  disabled={!selectedRa}
                  className={inputClass}
                  aria-label="Receiving programme"
                >
                  <option value="">Select receiving programme</option>
                  {receivingOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Effective date" hint="First date the RA belongs to the receiving programme.">
                <input
                  type="date"
                  value={effectiveDate}
                  min={today}
                  onChange={(e) => changeEffectiveDate(e.target.value)}
                  disabled={!selectedRa}
                  className={inputClass}
                />
              </Field>
            </div>

            {/* Effective-date explanation (spec §8) */}
            {effectiveDate && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  Current programme assignment ends{' '}
                  <strong className="text-foreground">{prettyDate(outgoingEndDate)}</strong>; receiving
                  programme assignment begins{' '}
                  <strong className="text-foreground">{prettyDate(effectiveDate)}</strong>.
                </span>
              </div>
            )}

            <div className="mt-3">
              <Field label="Reason / note (optional)">
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Rebalancing capacity toward card issuance"
                  className={inputClass}
                />
              </Field>
            </div>

            {sameProgramme && (
              <p className="mt-2 text-xs font-medium text-critical">
                Receiving programme must differ from the current programme.
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={generatePreview}
                disabled={!selectionsValid}
                className={btnGhost}
              >
                <ArrowLeftRight className="size-4" aria-hidden="true" />
                {preview ? 'Refresh preview' : 'Preview impact'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={!preview}
                className={btnPrimary}
              >
                Review &amp; switch
              </button>
            </div>
          </div>
        </div>

        {/* Aside: RA summary + preview */}
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserCircle className="size-4 text-muted-foreground" aria-hidden="true" />
              RA summary
            </h2>
            {selectedRa ? (
              <dl className="mt-3 space-y-2 text-sm">
                <Row label="Full name" value={selectedRa.name} />
                <Row label="RA code" value={selectedRa.code} mono />
                <Row label="Username" value={raUsername} mono />
                <div className="flex items-center gap-2 pt-1 text-foreground">
                  <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
                  {region}
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
                  {district}
                </div>
                <div className="pt-1">
                  <Tag tone="neutral">{outgoingProg?.name}</Tag>
                </div>
                <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
                  Identity, region and district cannot be changed here.
                </p>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Select a Registration Assistant to see their details.
              </p>
            )}
          </div>

          {preview && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">Estimated impact</h2>
                <Tag tone="warning">Estimate</Tag>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Confirmed by the backend on submit.
              </p>
              <div className="mt-4 space-y-4">
                <ImpactBlock title={preview.outgoingName} caption="Losing this RA" impact={preview.outgoing} />
                <ImpactBlock title={preview.receivingName} caption="Gaining this RA" impact={preview.receiving} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation dialog (spec §11) */}
      <AdminDialog
        open={confirmOpen}
        onClose={() => !submitting && setConfirmOpen(false)}
        title="Confirm programme switch"
        description="Review the details below. The backend performs the switch atomically and recalculates all affected KPIs."
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
              className={btnGhost}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmSwitch}
              disabled={submitting || !preview}
              className={btnPrimary}
            >
              {submitting ? 'Switching…' : 'Confirm programme switch'}
            </button>
          </>
        }
      >
        {preview && (
          <div className="space-y-4">
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Row label="RA" value={preview.raName} />
              <Row label="RA code" value={preview.raCode} mono />
              <Row label="District" value={preview.district} />
              <Row label="Region" value={preview.region} />
              <Row label="Current programme" value={preview.outgoingName} />
              <Row label="Receiving programme" value={preview.receivingName} />
              <Row label="Current assignment ends" value={prettyDate(preview.outgoingEndDate)} />
              <Row label="New assignment begins" value={prettyDate(preview.effectiveDate)} />
            </dl>

            <div className="grid gap-3 sm:grid-cols-2">
              <ImpactBlock title={preview.outgoingName} caption="Losing this RA" impact={preview.outgoing} />
              <ImpactBlock title={preview.receivingName} caption="Gaining this RA" impact={preview.receiving} />
            </div>

            <p className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              Historical entries and previous programme assignment records will be preserved. The RA
              remains under {preview.outgoingName} for dates before {prettyDate(preview.effectiveDate)}{' '}
              and belongs to {preview.receivingName} from that date onward.
            </p>
          </div>
        )}
      </AdminDialog>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-1 last:border-0 sm:block sm:border-0 sm:pb-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={cn('text-sm text-foreground', mono && 'font-mono text-[13px]')}>{value}</dd>
    </div>
  )
}

function ImpactBlock({
  title,
  caption,
  impact,
}: {
  title: string
  caption: string
  impact: ProgrammeImpact
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{caption}</div>
      <div className="mt-2 space-y-1.5 text-sm">
        <Delta label="RA count" before={impact.countBefore} after={impact.countAfter} />
        <Delta label="Daily target" before={impact.targetBefore} after={impact.targetAfter} />
      </div>
    </div>
  )
}

function Delta({ label, before, after }: { label: string; before: number; after: number }) {
  const up = after > before
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-[13px] tabular-nums text-foreground">
        {before.toLocaleString('en-US')}
        <span className="mx-1 text-muted-foreground">→</span>
        <span className={up ? 'text-success' : 'text-critical'}>{after.toLocaleString('en-US')}</span>
      </span>
    </div>
  )
}
