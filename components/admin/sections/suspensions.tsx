'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  getSuspensions,
  programmes,
  programmeCode,
  type Suspension,
  type ProgrammeId,
} from '@/lib/dashboard-data'
import { cn } from '@/lib/utils'
import { AdminDialog } from '../admin-dialog'
import { useToast } from '../toast'
import { Field, PageHeader, Tag, inputClass, btnPrimary, btnGhost, btnSmall } from '../ui'

const TODAY = '2026-06-30' // prototype "current" date, consistent with the snapshot data

function stateOf(s: Suspension): { label: string; tone: 'neutral' | 'warning' | 'critical' } {
  if (s.endDate && s.endDate < TODAY) return { label: 'ended', tone: 'neutral' }
  if (s.startDate > TODAY) return { label: 'scheduled', tone: 'warning' }
  return { label: 'active', tone: 'critical' }
}

export function SuspensionsSection() {
  const { notify } = useToast()
  const [items, setItems] = useState<Suspension[]>(() => getSuspensions())
  const [createOpen, setCreateOpen] = useState(false)

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [items],
  )

  function cancel(s: Suspension) {
    const isFuture = s.startDate > TODAY
    if (isFuture) {
      setItems((prev) => prev.filter((x) => x.id !== s.id))
      notify('Upcoming suspension deleted', 'info')
    } else {
      setItems((prev) => prev.map((x) => (x.id === s.id ? { ...x, endDate: TODAY } : x)))
      notify('Active suspension ended today', 'info')
    }
  }

  function create(form: CreateForm) {
    const p = programmes.find((x) => x.id === form.programmeId)!
    const s: Suspension = {
      id: `susp-${Date.now()}`,
      programmeId: form.programmeId as ProgrammeId,
      programmeName: p.name,
      programmeCode: programmeCode[p.id],
      startDate: form.startDate,
      endDate: form.endDate || null,
      reason: form.reason.trim() || null,
    }
    setItems((prev) => [s, ...prev])
    setCreateOpen(false)
    notify('Suspension scheduled. Targets paused for the window.')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Programme suspensions"
        description="Pause target expectations for a programme during downtime, holidays or system outages. While suspended, KPI targets are not accrued and DROs cannot submit for those dates."
        action={
          <button type="button" onClick={() => setCreateOpen(true)} className={btnPrimary}>
            <Plus className="size-4" aria-hidden="true" />
            Schedule suspension
          </button>
        }
      />

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Programme</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => {
                const st = stateOf(s)
                const canCancel = !s.endDate || s.endDate >= TODAY
                return (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{s.programmeName}</div>
                      <div className="font-mono text-xs text-muted-foreground">{s.programmeCode}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-foreground">
                      {s.startDate}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                      {s.endDate ?? 'open-ended'}
                    </td>
                    <td className="px-4 py-3 text-xs italic text-muted-foreground">
                      {s.reason ? `"${s.reason}"` : 'no reason recorded'}
                    </td>
                    <td className="px-4 py-3">
                      <Tag tone={st.tone}>{st.label}</Tag>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canCancel && (
                        <button type="button" onClick={() => cancel(s)} className={btnSmall}>
                          {s.startDate > TODAY ? 'Delete' : 'End today'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No suspensions on file.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {sorted.map((s) => {
          const st = stateOf(s)
          const canCancel = !s.endDate || s.endDate >= TODAY
          return (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{s.programmeName}</div>
                  <div className="font-mono text-xs text-muted-foreground">{s.programmeCode}</div>
                </div>
                <Tag tone={st.tone}>{st.label}</Tag>
              </div>
              <div className="mt-2 font-mono text-xs text-muted-foreground">
                {s.startDate} → {s.endDate ?? 'open-ended'}
              </div>
              {s.reason && <p className="mt-1 text-xs italic text-muted-foreground">"{s.reason}"</p>}
              {canCancel && (
                <button type="button" onClick={() => cancel(s)} className={cn(btnSmall, 'mt-3 w-full')}>
                  {s.startDate > TODAY ? 'Delete' : 'End today'}
                </button>
              )}
            </div>
          )
        })}
        {sorted.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No suspensions on file.</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {items.length} suspension{items.length === 1 ? '' : 's'} on file
      </p>

      {createOpen && <CreateSuspensionDialog onClose={() => setCreateOpen(false)} onCreate={create} />}
    </div>
  )
}

interface CreateForm {
  programmeId: ProgrammeId | ''
  startDate: string
  endDate: string
  reason: string
}

function CreateSuspensionDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (form: CreateForm) => void
}) {
  const [form, setForm] = useState<CreateForm>({
    programmeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  })

  const canCreate =
    form.programmeId && form.startDate && (!form.endDate || form.endDate >= form.startDate)

  return (
    <AdminDialog
      open
      onClose={onClose}
      title="Schedule a suspension"
      description="KPI targets pause for the selected programme between these dates. DROs are blocked from submitting new output for that window. Leave the end date empty for an open-ended pause."
      footer={
        <>
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!canCreate}
            onClick={() => onCreate(form)}
            className={btnPrimary}
          >
            Schedule
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Programme">
          <select
            value={form.programmeId}
            onChange={(e) => setForm({ ...form, programmeId: e.target.value as ProgrammeId })}
            className={inputClass}
          >
            <option value="">Select a programme...</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({programmeCode[p.id]})
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start date">
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className={cn(inputClass, 'font-mono')}
            />
          </Field>
          <Field label="End date (optional)">
            <input
              type="date"
              min={form.startDate || undefined}
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className={cn(inputClass, 'font-mono')}
            />
          </Field>
        </div>
        <Field label="Reason (optional)">
          <textarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            rows={2}
            placeholder="e.g. Public holiday, system upgrade, security exercise..."
            className={cn(inputClass, 'h-auto resize-y py-2')}
          />
        </Field>
      </div>
    </AdminDialog>
  )
}
