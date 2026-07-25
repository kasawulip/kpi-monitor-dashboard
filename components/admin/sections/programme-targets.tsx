'use client'

import { useMemo, useState } from 'react'
import { History, Pencil } from 'lucide-react'
import {
  getProgrammeConfigs,
  programmeStatuses,
  fmtNumber,
  type ProgrammeConfig,
  type ProgrammeStatus,
} from '@/lib/dashboard-data'
import { cn } from '@/lib/utils'
import { AdminDialog } from '../admin-dialog'
import { useToast } from '../toast'
import { Field, PageHeader, Tag, inputClass, btnPrimary, btnGhost, btnSmall } from '../ui'

const statusTone: Record<ProgrammeStatus, 'neutral' | 'success' | 'warning' | 'critical'> = {
  DRAFT: 'neutral',
  SCHEDULED: 'warning',
  ACTIVE: 'success',
  PAUSED_NATIONALLY: 'warning',
  ADMINISTRATIVELY_COMPLETED: 'neutral',
  CLOSED: 'critical',
}

function statusLabel(s: ProgrammeStatus) {
  return programmeStatuses.find((x) => x.value === s)?.label ?? s
}

export function ProgrammeTargets() {
  const { notify } = useToast()
  const [rows, setRows] = useState<ProgrammeConfig[]>(() => getProgrammeConfigs())
  const [editing, setEditing] = useState<ProgrammeConfig | null>(null)
  const [historyOf, setHistoryOf] = useState<ProgrammeConfig | null>(null)

  function changeStatus(id: string, status: ProgrammeStatus) {
    setRows((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status,
              version: p.version + 1,
              history: [
                {
                  id: `${p.id}-${Date.now()}`,
                  changedAt: new Date().toISOString(),
                  changedBy: 'a.mwanga (PRO-IS)',
                  summary: `Status changed to ${statusLabel(status)}`,
                },
                ...p.history,
              ],
            }
          : p,
      ),
    )
    notify(`Status updated to ${statusLabel(status)}. KPIs will recompute.`)
  }

  function saveEdit(updated: ProgrammeConfig, summary: string) {
    setRows((prev) =>
      prev.map((p) =>
        p.id === updated.id
          ? {
              ...updated,
              version: p.version + 1,
              history: [
                {
                  id: `${p.id}-${Date.now()}`,
                  changedAt: new Date().toISOString(),
                  changedBy: 'a.mwanga (PRO-IS)',
                  summary,
                },
                ...p.history,
              ],
            }
          : p,
      ),
    )
    setEditing(null)
    notify('Target configuration saved. Cascade rebuild queued.')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitor"
        title="Programme targets"
        description="Configure the daily per-RA target, working days, exercise duration and window for each programme. Every save is logged as an immutable history row and KPIs recompute automatically."
      />

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Programme</th>
                <th className="px-4 py-3 text-right">Target / RA / day</th>
                <th className="px-4 py-3 text-right">Days / wk</th>
                <th className="px-4 py-3 text-right">Working days</th>
                <th className="px-4 py-3 text-right">Duration</th>
                <th className="px-4 py-3">Window</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Changes</th>
                <th className="px-4 py-3 text-right">Edit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{p.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{p.code}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-foreground">
                    {p.dailyTargetPerRa}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                    {p.workingDaysPerWeek}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                    {p.workingDays}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                    {p.durationDays} d
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                    {p.startDate} → {p.endDate}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.status}
                      onChange={(e) => changeStatus(p.id, e.target.value as ProgrammeStatus)}
                      className="h-8 rounded-lg border border-input bg-card px-2 font-mono text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                      aria-label={`Status for ${p.name}`}
                    >
                      {programmeStatuses.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setHistoryOf(p)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <History className="size-3.5" aria-hidden="true" />
                      {p.history.length}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      className={cn(btnSmall)}
                      aria-label={`Edit ${p.name}`}
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {rows.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-foreground">{p.name}</div>
                <div className="font-mono text-xs text-muted-foreground">{p.code}</div>
              </div>
              <Tag tone={statusTone[p.status]}>{statusLabel(p.status)}</Tag>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Stat label="Target / RA / day" value={String(p.dailyTargetPerRa)} />
              <Stat label="Working days" value={`${p.workingDays} / ${p.durationDays}d`} />
              <Stat label="Days / week" value={String(p.workingDaysPerWeek)} />
              <Stat label="Req. op-days" value={String(p.requiredOperationalDays)} />
            </dl>
            <div className="mt-3 font-mono text-xs text-muted-foreground">
              {p.startDate} → {p.endDate}
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setEditing(p)} className={cn(btnSmall, 'flex-1')}>
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit
              </button>
              <button type="button" onClick={() => setHistoryOf(p)} className={cn(btnSmall, 'flex-1')}>
                <History className="size-3.5" aria-hidden="true" />
                {p.history.length} changes
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <EditTargetDialog config={editing} onClose={() => setEditing(null)} onSave={saveEdit} />
      )}

      <AdminDialog
        open={!!historyOf}
        onClose={() => setHistoryOf(null)}
        title={`Change history — ${historyOf?.name ?? ''}`}
        description="Immutable log of every target configuration change for this programme."
        size="lg"
      >
        <ol className="flex flex-col gap-3">
          {historyOf?.history.map((h) => (
            <li key={h.id} className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{h.summary}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {new Date(h.changedAt).toISOString().slice(0, 16).replace('T', ' ')} UTC
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">by {h.changedBy}</div>
            </li>
          ))}
        </ol>
      </AdminDialog>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  )
}

function EditTargetDialog({
  config,
  onClose,
  onSave,
}: {
  config: ProgrammeConfig
  onClose: () => void
  onSave: (c: ProgrammeConfig, summary: string) => void
}) {
  const [form, setForm] = useState<ProgrammeConfig>(config)

  const changed = useMemo(() => {
    const parts: string[] = []
    if (form.dailyTargetPerRa !== config.dailyTargetPerRa)
      parts.push(`target ${config.dailyTargetPerRa}→${form.dailyTargetPerRa}/RA`)
    if (form.workingDaysPerWeek !== config.workingDaysPerWeek)
      parts.push(`days/wk ${config.workingDaysPerWeek}→${form.workingDaysPerWeek}`)
    if (form.workingDays !== config.workingDays)
      parts.push(`working days ${config.workingDays}→${form.workingDays}`)
    if (form.durationDays !== config.durationDays)
      parts.push(`duration ${config.durationDays}→${form.durationDays}d`)
    if (form.requiredOperationalDays !== config.requiredOperationalDays)
      parts.push(`req op-days ${config.requiredOperationalDays}→${form.requiredOperationalDays}`)
    if (form.startDate !== config.startDate || form.endDate !== config.endDate)
      parts.push('adjusted window')
    return parts
  }, [form, config])

  const num = (v: string) => Math.max(0, parseInt(v.replace(/[^0-9]/g, ''), 10) || 0)
  const valid = form.dailyTargetPerRa > 0 && form.durationDays > 0 && form.endDate >= form.startDate

  return (
    <AdminDialog
      open
      onClose={onClose}
      title={`Edit targets — ${config.name}`}
      description="Changes are logged and trigger a KPI cascade rebuild across all regions and districts."
      footer={
        <>
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid || changed.length === 0}
            onClick={() =>
              onSave(form, changed.length ? `Updated ${changed.join(', ')}` : 'No changes')
            }
            className={btnPrimary}
          >
            Save changes
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Daily target / RA">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={form.dailyTargetPerRa}
            onChange={(e) => setForm({ ...form, dailyTargetPerRa: num(e.target.value) })}
            className={cn(inputClass, 'font-mono')}
          />
        </Field>
        <Field label="Working days / week">
          <input
            type="number"
            min={1}
            max={7}
            inputMode="numeric"
            value={form.workingDaysPerWeek}
            onChange={(e) =>
              setForm({ ...form, workingDaysPerWeek: Math.min(7, num(e.target.value)) })
            }
            className={cn(inputClass, 'font-mono')}
          />
        </Field>
        <Field label="Total working days">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={form.workingDays}
            onChange={(e) => setForm({ ...form, workingDays: num(e.target.value) })}
            className={cn(inputClass, 'font-mono')}
          />
        </Field>
        <Field label="Duration (days)">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={form.durationDays}
            onChange={(e) => setForm({ ...form, durationDays: num(e.target.value) })}
            className={cn(inputClass, 'font-mono')}
          />
        </Field>
        <Field label="Start date">
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className={cn(inputClass, 'font-mono')}
          />
        </Field>
        <Field label="End date">
          <input
            type="date"
            min={form.startDate}
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className={cn(inputClass, 'font-mono')}
          />
        </Field>
        <Field label="Required operational days">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={form.requiredOperationalDays}
            onChange={(e) => setForm({ ...form, requiredOperationalDays: num(e.target.value) })}
            className={cn(inputClass, 'font-mono')}
          />
        </Field>
      </div>
      {!valid && (
        <p className="mt-3 text-xs text-critical">
          Check that target and duration are above zero and the end date is on or after the start date.
        </p>
      )}
      {valid && changed.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Pending: {changed.join(' · ')}. Version {config.version} → {config.version + 1}.
        </p>
      )}
    </AdminDialog>
  )
}
