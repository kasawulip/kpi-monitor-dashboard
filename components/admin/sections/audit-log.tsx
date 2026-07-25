'use client'

import { Fragment, useMemo, useState } from 'react'
import { ScrollText } from 'lucide-react'
import {
  getAuditLogs,
  auditActions,
  type AuditLogEntry,
  type UserRole,
} from '@/lib/dashboard-data'
import { cn } from '@/lib/utils'
import { Field, PageHeader, RolePill, inputClass, btnGhost } from '../ui'

const roles: UserRole[] = ['PRO-IS', 'SRO-FS', 'DRO']
const PAGE_SIZE = 12

interface Filters {
  action: string
  role: string
  entity: string
  from: string
  to: string
}

const emptyFilters: Filters = { action: '', role: '', entity: '', from: '', to: '' }

export function AuditLogSection() {
  const all = useMemo(() => getAuditLogs(), [])
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return all.filter((r) => {
      if (filters.action && r.action !== filters.action) return false
      if (filters.role && r.actorRole !== filters.role) return false
      if (filters.entity && !r.entityType.toLowerCase().includes(filters.entity.toLowerCase()))
        return false
      const day = r.createdAt.slice(0, 10)
      if (filters.from && day < filters.from) return false
      if (filters.to && day > filters.to) return false
      return true
    })
  }, [all, filters])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    setPage(1)
    setFilters((f) => ({ ...f, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Audit log"
        description="Every mutation in the platform — logins, user changes, target changes, RA replacements, suspensions, imports and report generations — is logged here. Read-only."
      />

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Action">
            <select value={filters.action} onChange={(e) => set('action', e.target.value)} className={inputClass}>
              <option value="">All actions</option>
              {auditActions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Actor role">
            <select value={filters.role} onChange={(e) => set('role', e.target.value)} className={inputClass}>
              <option value="">All roles</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Entity type">
            <input
              value={filters.entity}
              onChange={(e) => set('entity', e.target.value)}
              placeholder="e.g. user, programme"
              className={inputClass}
            />
          </Field>
          <Field label="From">
            <input type="date" value={filters.from} onChange={(e) => set('from', e.target.value)} className={cn(inputClass, 'font-mono')} />
          </Field>
          <Field label="To">
            <input type="date" value={filters.to} onChange={(e) => set('to', e.target.value)} className={cn(inputClass, 'font-mono')} />
          </Field>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">{filtered.length.toLocaleString()} events</span>
          <button
            type="button"
            onClick={() => {
              setFilters(emptyFilters)
              setPage(1)
            }}
            className={cn(btnGhost, 'h-8 px-3 text-xs')}
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">When (UTC)</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Fragment key={row.id}>
                  <tr
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
                    onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs tabular-nums text-foreground">
                      {row.createdAt.slice(0, 19).replace('T', ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                        {row.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{row.actorUsername}</td>
                    <td className="px-4 py-3">
                      <RolePill role={row.actorRole} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {row.entityType}{' '}
                      <span className="font-mono text-[11px] text-muted-foreground/70">
                        {row.entityId}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.ip}</td>
                  </tr>
                  {expanded === row.id && (
                    <tr>
                      <td colSpan={6} className="border-b border-border bg-muted/40 px-4 py-3">
                        <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-muted-foreground">
                          {JSON.stringify(row.metadata, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No matching events.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={current} pages={pages} onPage={setPage} />
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => setExpanded(expanded === row.id ? null : row.id)}
            className="w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-block rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                {row.action}
              </span>
              <RolePill role={row.actorRole} />
            </div>
            <div className="mt-2 font-mono text-xs tabular-nums text-muted-foreground">
              {row.createdAt.slice(0, 19).replace('T', ' ')} UTC
            </div>
            <div className="mt-1 text-sm text-foreground">
              <span className="font-mono">{row.actorUsername}</span>{' '}
              <span className="text-muted-foreground">· {row.entityType} {row.entityId}</span>
            </div>
            {expanded === row.id && (
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/50 p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {JSON.stringify(row.metadata, null, 2)}
              </pre>
            )}
          </button>
        ))}
        {rows.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No matching events.</p>
        )}
        <Pagination page={current} pages={pages} onPage={setPage} />
      </div>
    </div>
  )
}

function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number
  pages: number
  onPage: (p: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
      <span className="text-xs text-muted-foreground">
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(Math.max(1, page - 1))}
          className={cn(btnGhost, 'h-8 px-3 text-xs')}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(Math.min(pages, page + 1))}
          className={cn(btnGhost, 'h-8 px-3 text-xs')}
        >
          Next
        </button>
      </div>
    </div>
  )
}
