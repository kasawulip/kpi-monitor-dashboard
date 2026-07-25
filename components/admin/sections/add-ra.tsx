'use client'

import { useMemo, useState } from 'react'
import { UserPlus, MapPin, Building2 } from 'lucide-react'
import {
  regionNames,
  districtsByRegion,
  programmes,
  getDistrictRas,
  type ProgrammeId,
  type RaOption,
} from '@/lib/dashboard-data'
import { cn } from '@/lib/utils'
import { useToast } from '../toast'
import { Field, PageHeader, Tag, inputClass, btnPrimary, btnGhost } from '../ui'

/** Username policy preview — mirrors the reference username_service (first.last). */
function usernamePreview(first: string, last: string) {
  const clean = (s: string) =>
    (s || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)[0]
      .replace(/[^a-z0-9]+/g, '')
  const f = clean(first)
  const l = clean(last)
  if (!f || !l) return ''
  return `${f}.${l}`
}

interface NewRa extends RaOption {
  startDate: string
  scopeLabel: string
  isNew?: boolean
}

const today = '2026-06-30'

export function AddRaSection() {
  const { notify } = useToast()

  const [region, setRegion] = useState('')
  const [district, setDistrict] = useState('')
  const [programme, setProgramme] = useState<ProgrammeId | ''>('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [raCode, setRaCode] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [staffNumber, setStaffNumber] = useState('')
  const [added, setAdded] = useState<NewRa[]>([])

  const districtOptions = region ? districtsByRegion[region] ?? [] : []
  const previewUsername = usernamePreview(firstName, lastName)
  const scopeReady = Boolean(region && district && programme)

  // Existing active roster for the chosen scope, plus any RAs onboarded this session.
  const roster = useMemo<NewRa[]>(() => {
    if (!scopeReady) return added
    const scopeLabel = `${district}, ${region.replace(' Region', '')}`
    const existing = getDistrictRas(programme as ProgrammeId, region, district).map((ra) => ({
      ...ra,
      startDate: '2026-06-01',
      scopeLabel,
    }))
    const scoped = added.filter(
      (a) => a.programmeId === programme && a.scopeLabel === scopeLabel,
    )
    return [...scoped, ...existing]
  }, [scopeReady, added, programme, region, district])

  const formValid =
    scopeReady &&
    firstName.trim() &&
    lastName.trim() &&
    raCode.trim().length >= 2 &&
    startDate &&
    previewUsername

  function submit() {
    if (!formValid) return
    const scopeLabel = `${district}, ${region.replace(' Region', '')}`
    const code = raCode.trim().toUpperCase()
    if (roster.some((r) => r.code === code)) {
      notify('That RA code is already in use. Codes must be nationally unique.', 'error')
      return
    }
    const ra: NewRa = {
      id: `ra-${Date.now()}`,
      name: `${firstName.trim()} ${lastName.trim()}`,
      code,
      programmeId: programme as ProgrammeId,
      startDate,
      scopeLabel,
      isNew: true,
    }
    setAdded((prev) => [ra, ...prev])
    notify(`Registration Assistant ${previewUsername} onboarded to ${scopeLabel}.`, 'success')
    // Reset the assistant-specific fields, keep the scope for rapid entry.
    setFirstName('')
    setLastName('')
    setRaCode('')
    setStaffNumber('')
  }

  const programmeName = programmes.find((p) => p.id === programme)?.name

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="RA Management"
        title="Add new Registration Assistant"
        description="Onboard a Registration Assistant to a district programme. A login username is generated automatically from the assistant's name."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-3">
          <h2 className="text-sm font-semibold text-foreground">Assistant details</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            All fields are required unless marked optional.
          </p>

          {/* Scope */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Field label="Region">
              <select
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value)
                  setDistrict('')
                }}
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
                onChange={(e) => setDistrict(e.target.value)}
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
            <Field label="Programme">
              <select
                value={programme}
                onChange={(e) => setProgramme(e.target.value as ProgrammeId)}
                disabled={!district}
                className={cn(inputClass, !district && 'cursor-not-allowed opacity-50')}
                aria-label="Programme"
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

          {/* Names */}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="First name">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Sarah"
                className={inputClass}
              />
            </Field>
            <Field label="Last name">
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Nabirye"
                className={inputClass}
              />
            </Field>
          </div>

          {/* Username + code */}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Generated username" hint="Final value is confirmed on save; a suffix is added on collision.">
              <input
                value={previewUsername}
                readOnly
                placeholder="first.last"
                className={cn(inputClass, 'bg-muted/50 font-mono text-[13px]')}
              />
            </Field>
            <Field label="RA code" hint="Nationally unique identifier.">
              <input
                value={raCode}
                onChange={(e) => setRaCode(e.target.value.toUpperCase())}
                placeholder="e.g. EAS-TORORO-RA47"
                className={cn(inputClass, 'font-mono text-[13px]')}
              />
            </Field>
          </div>

          {/* Start date + staff number */}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Start date" hint="First assigned day for the assistant.">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Staff number (optional)">
              <input
                value={staffNumber}
                onChange={(e) => setStaffNumber(e.target.value)}
                placeholder="e.g. NIRA-88213"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setFirstName('')
                setLastName('')
                setRaCode('')
                setStaffNumber('')
              }}
              className={btnGhost}
            >
              Clear
            </button>
            <button type="button" onClick={submit} disabled={!formValid} className={btnPrimary}>
              <UserPlus className="size-4" aria-hidden="true" />
              Add Registration Assistant
            </button>
          </div>
        </div>

        {/* Summary aside */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Assignment scope</h2>
          {scopeReady ? (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
                {region}
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
                {district}
              </div>
              <Tag tone="neutral">{programmeName}</Tag>
              <p className="pt-2 text-xs leading-relaxed text-muted-foreground">
                The assistant becomes eligible for data entry from the start date. Historical
                performance is always attributed to the assistant who captured it.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Choose a region, district and programme to see the assignment scope and the current
              roster.
            </p>
          )}
        </div>
      </div>

      {/* Roster for the selected scope */}
      {scopeReady && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Roster · {district}
            </h2>
            <span className="text-xs text-muted-foreground">{roster.length} assistants</span>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">RA code</th>
                    <th className="px-4 py-3">Start date</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((ra) => (
                    <tr key={ra.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-foreground">{ra.name}</td>
                      <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{ra.code}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ra.startDate}</td>
                      <td className="px-4 py-3 text-right">
                        <Tag tone={ra.isNew ? 'success' : 'neutral'}>
                          {ra.isNew ? 'New' : 'Active'}
                        </Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {roster.map((ra) => (
              <div key={ra.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{ra.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{ra.code}</div>
                  </div>
                  <Tag tone={ra.isNew ? 'success' : 'neutral'}>{ra.isNew ? 'New' : 'Active'}</Tag>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">Start: {ra.startDate}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
