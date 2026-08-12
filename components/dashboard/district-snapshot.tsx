'use client'

import { useMemo, useState } from 'react'
import {
  districtsByRegion,
  getDaySnapshot,
  programmes,
  regionNames,
  type ProgrammeId,
} from '@/lib/dashboard-data'
import { cn } from '@/lib/utils'
import { CalendarDays, ChevronDown, MapPin, Building2, Layers, Users } from 'lucide-react'

const accentBar: Record<string, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  critical: 'bg-critical',
}

export function DistrictSnapshot({
  defaultProgramme = 'nid-registration',
  lockedRegion,
  lockedDistrict,
}: {
  defaultProgramme?: ProgrammeId
  lockedRegion?: string
  lockedDistrict?: string
}) {
  const locked = Boolean(lockedRegion && lockedDistrict)
  const [region, setRegion] = useState<string>(lockedRegion ?? '')
  const [district, setDistrict] = useState<string>(lockedDistrict ?? '')
  const [programme, setProgramme] = useState<ProgrammeId>(defaultProgramme)
  const [date, setDate] = useState<string>('2026-06-30')

  const districtOptions = region ? districtsByRegion[region] ?? [] : []
  const ready = Boolean(region && district && programme && date)

  const snapshot = useMemo(
    () => (ready ? getDaySnapshot(programme, region, district, date) : null),
    [ready, programme, region, district, date],
  )

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-4 md:p-5">
        <h2 className="text-sm font-semibold text-foreground md:text-base">
          {locked ? 'My district daily snapshot' : 'District daily snapshot'}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {locked
            ? "Choose a programme and date to view that day's registration-assistant performance for your district."
            : "Choose a region, district, programme and date to view that day's registration-assistant performance."}
        </p>

        {/* Locked scope chips (DRO) */}
        {locked && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground">
              <MapPin className="size-3.5 text-muted-foreground" aria-hidden="true" />
              {lockedRegion}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground">
              <Building2 className="size-3.5 text-muted-foreground" aria-hidden="true" />
              {lockedDistrict}
            </span>
          </div>
        )}

        {/* Cascading selectors */}
        <div className={cn('mt-4 grid gap-3 sm:grid-cols-2', locked ? 'lg:grid-cols-2' : 'lg:grid-cols-4')}>
          {!locked && (
            <SelectField
              id="snap-region"
              label="Region"
              icon={<MapPin className="size-4" aria-hidden="true" />}
              value={region}
              placeholder="Select region"
              options={regionNames.map((r) => ({ value: r, label: r }))}
              onChange={(v) => {
                setRegion(v)
                setDistrict('')
              }}
            />
          )}
          {!locked && (
            <SelectField
              id="snap-district"
              label="District"
              icon={<Building2 className="size-4" aria-hidden="true" />}
              value={district}
              placeholder={region ? 'Select district' : 'Select region first'}
              disabled={!region}
              options={districtOptions.map((d) => ({ value: d, label: d }))}
              onChange={setDistrict}
            />
          )}
          <SelectField
            id="snap-programme"
            label="Programme"
            icon={<Layers className="size-4" aria-hidden="true" />}
            value={programme}
            options={programmes.map((p) => ({ value: p.id, label: p.name }))}
            onChange={(v) => setProgramme(v as ProgrammeId)}
          />
          <div>
            <label
              htmlFor="snap-date"
              className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              Snapshot date
            </label>
            <input
              id="snap-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Result */}
      {!ready || !snapshot ? (
        <EmptyState hasRegion={Boolean(region)} hasDistrict={Boolean(district)} />
      ) : (
        <div className="p-4 md:p-5">
          {/* Snapshot date banner */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Snapshot date
            </p>
            <div className="mt-1.5 rounded-xl border border-border bg-background px-4 py-3 text-center">
              <span className="text-lg font-semibold text-foreground md:text-xl">
                {snapshot.dateLabel}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {district}, {region.replace(' Region', '')} &middot;{' '}
              {programmes.find((p) => p.id === programme)?.name}
            </p>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SnapshotKpi
              accent="primary"
              label={`Total ${snapshot.captureNoun}`}
              value={snapshot.totalCaptured.toLocaleString()}
            />
            <SnapshotKpi accent="success" label="Avg per RA" value={snapshot.avgPerRa.toLocaleString()} />
            <SnapshotKpi accent="warning" label="RAs with entry" value={snapshot.rasWithEntry.toLocaleString()} />
            <SnapshotKpi
              accent="critical"
              label="RAs without entry"
              value={snapshot.rasWithoutEntry.toLocaleString()}
            />
          </div>

          {/* RA detail table */}
          <div className="mt-5 overflow-hidden rounded-xl border border-border">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">
                RA detail &mdash; {snapshot.dateISO}
              </h3>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3.5" aria-hidden="true" />
                {snapshot.rasTotal} RAs
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-4 py-2.5 font-medium">RA</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Reg #</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Captured</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.ras.map((ra) => (
                    <tr
                      key={ra.regNo}
                      className="border-b border-border/60 last:border-0 hover:bg-accent/30"
                    >
                      <td className="px-4 py-2.5 font-medium text-foreground">{ra.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                        {ra.regNo}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {ra.captured > 0 ? (
                          <span className="font-mono font-semibold tabular-nums text-foreground">
                            {ra.captured}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-critical-muted px-2 py-0.5 font-mono text-xs font-medium text-critical">
                            0
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function SnapshotKpi({
  accent,
  label,
  value,
}: {
  accent: keyof typeof accentBar
  label: string
  value: string
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className={cn('h-1.5 w-full', accentBar[accent])} aria-hidden="true" />
      <div className="p-3 md:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-foreground md:text-3xl">
          {value}
        </p>
      </div>
    </div>
  )
}

function EmptyState({ hasRegion, hasDistrict }: { hasRegion: boolean; hasDistrict: boolean }) {
  const message = !hasRegion
    ? 'Select a region to begin.'
    : !hasDistrict
      ? 'Now select a district within the region.'
      : 'Select a programme and date to view the snapshot.'
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted">
        <MapPin className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-foreground">No snapshot selected</p>
      <p className="max-w-xs text-xs text-muted-foreground">{message}</p>
    </div>
  )
}

function SelectField({
  id,
  label,
  icon,
  value,
  placeholder,
  options,
  onChange,
  disabled,
}: {
  id: string
  label: string
  icon: React.ReactNode
  value: string
  placeholder?: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
      >
        {icon}
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-11 w-full appearance-none rounded-xl border border-border bg-background pl-3 pr-9 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 md:text-sm',
            !value && 'text-muted-foreground',
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} className="text-foreground">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
