'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, Copy } from 'lucide-react'
import {
  getAdminUsers,
  districtsByRegion,
  regionNames,
  type AdminUser,
  type UserRole,
} from '@/lib/dashboard-data'
import { cn } from '@/lib/utils'
import { AdminDialog } from '../admin-dialog'
import { useToast } from '../toast'
import { Field, PageHeader, RolePill, Tag, inputClass, btnPrimary, btnGhost, btnSmall } from '../ui'

const roles: UserRole[] = ['PRO-IS', 'SRO-FS', 'DRO']

function scopeOf(u: AdminUser) {
  if (u.districtName) return `${u.districtName}, ${u.regionName?.replace(' Region', '')}`
  if (u.regionName) return u.regionName
  return 'National'
}

function makeTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return `${out.slice(0, 5)}-${out.slice(5)}`
}

export function UsersSection() {
  const { notify } = useToast()
  const [users, setUsers] = useState<AdminUser[]>(() => getAdminUsers())
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [activeFilter, setActiveFilter] = useState<'' | 'yes' | 'no'>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [tempPwd, setTempPwd] = useState<{ username: string; temp: string } | null>(null)

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false
      if (activeFilter === 'yes' && !u.isActive) return false
      if (activeFilter === 'no' && u.isActive) return false
      if (search) {
        const q = search.toLowerCase()
        if (!u.username.toLowerCase().includes(q) && !u.fullName.toLowerCase().includes(q))
          return false
      }
      return true
    })
  }, [users, roleFilter, activeFilter, search])

  function createUser(form: NewUserForm) {
    const temp = makeTempPassword()
    const user: AdminUser = {
      id: `user-${Date.now()}`,
      username: form.username.trim().toLowerCase(),
      fullName: form.fullName.trim(),
      role: form.role as UserRole,
      regionName: form.role === 'PRO-IS' ? null : form.regionName || null,
      districtName: form.role === 'DRO' ? form.districtName || null : null,
      isActive: true,
      mustChangePassword: true,
    }
    setUsers((prev) => [user, ...prev])
    setCreateOpen(false)
    setTempPwd({ username: user.username, temp })
    notify(`Created ${user.username}`)
  }

  function resetPwd(u: AdminUser) {
    const temp = makeTempPassword()
    setUsers((prev) =>
      prev.map((x) => (x.id === u.id ? { ...x, mustChangePassword: true } : x)),
    )
    setTempPwd({ username: u.username, temp })
    notify(`Password reset for ${u.username}`)
  }

  function toggleActive(u: AdminUser) {
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: !x.isActive } : x)))
    notify(u.isActive ? `Deactivated ${u.username}` : `Reactivated ${u.username}`, 'info')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description="Create and manage PRO-IS, SRO-FS and DRO accounts. New users receive a one-time password shown once, and must change it at first login."
        action={
          <button type="button" onClick={() => setCreateOpen(true)} className={btnPrimary}>
            <Plus className="size-4" aria-hidden="true" />
            Create user
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="relative min-w-[12rem] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username or name..."
            className={cn(inputClass, 'pl-9')}
            aria-label="Search users"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
          className={cn(inputClass, 'w-auto')}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as '' | 'yes' | 'no')}
          className={cn(inputClass, 'w-auto')}
          aria-label="Filter by status"
        >
          <option value="">Any status</option>
          <option value="yes">Active</option>
          <option value="no">Inactive</option>
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Full name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-[13px] text-foreground">{u.username}</td>
                  <td className="px-4 py-3 text-foreground">{u.fullName}</td>
                  <td className="px-4 py-3">
                    <RolePill role={u.role} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{scopeOf(u)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag tone={u.isActive ? 'success' : 'neutral'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Tag>
                      {u.mustChangePassword && (
                        <span className="text-xs text-warning">must reset</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => resetPwd(u)} className={btnSmall}>
                        Reset password
                      </button>
                      <button type="button" onClick={() => toggleActive(u)} className={btnSmall}>
                        {u.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No users match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((u) => (
          <div key={u.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-sm text-foreground">{u.username}</div>
                <div className="text-sm text-muted-foreground">{u.fullName}</div>
              </div>
              <RolePill role={u.role} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Tag tone={u.isActive ? 'success' : 'neutral'}>
                {u.isActive ? 'Active' : 'Inactive'}
              </Tag>
              {u.mustChangePassword && <span className="text-xs text-warning">must reset</span>}
              <span className="text-xs text-muted-foreground">{scopeOf(u)}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => resetPwd(u)} className={cn(btnSmall, 'flex-1')}>
                Reset password
              </button>
              <button type="button" onClick={() => toggleActive(u)} className={cn(btnSmall, 'flex-1')}>
                {u.isActive ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No users match your filters.</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {users.length} users
      </p>

      {createOpen && <CreateUserDialog onClose={() => setCreateOpen(false)} onCreate={createUser} />}

      {/* One-time temp password */}
      <AdminDialog
        open={!!tempPwd}
        onClose={() => setTempPwd(null)}
        title="Temporary password"
        description={`Copy this password now and share it with ${tempPwd?.username ?? ''} through a secure channel. It will not be shown again.`}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setTempPwd(null)} className={btnGhost}>
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(tempPwd?.temp ?? '')
                notify('Copied to clipboard', 'info')
              }}
              className={btnPrimary}
            >
              <Copy className="size-4" aria-hidden="true" />
              Copy
            </button>
          </>
        }
      >
        <div className="select-all rounded-xl border border-border bg-muted/50 py-4 text-center font-mono text-lg tracking-widest text-foreground">
          {tempPwd?.temp}
        </div>
      </AdminDialog>
    </div>
  )
}

interface NewUserForm {
  username: string
  fullName: string
  role: UserRole | ''
  regionName: string
  districtName: string
}

function CreateUserDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (form: NewUserForm) => void
}) {
  const [form, setForm] = useState<NewUserForm>({
    username: '',
    fullName: '',
    role: '',
    regionName: '',
    districtName: '',
  })

  const districts = form.regionName ? districtsByRegion[form.regionName] ?? [] : []

  const canCreate =
    form.username.trim() &&
    form.fullName.trim() &&
    form.role &&
    (form.role === 'PRO-IS' ||
      (form.role === 'SRO-FS' && form.regionName) ||
      (form.role === 'DRO' && form.regionName && form.districtName))

  return (
    <AdminDialog
      open
      onClose={onClose}
      title="Create user"
      description="The user will receive a one-time password. They must change it on first login."
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
            Create user
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Username" htmlFor="new-username">
          <input
            id="new-username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className={inputClass}
            placeholder="e.g. j.okello"
          />
        </Field>
        <Field label="Full name" htmlFor="new-fullname">
          <input
            id="new-fullname"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className={inputClass}
            placeholder="e.g. Joseph Okello"
          />
        </Field>
        <Field label="Role">
          <select
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as UserRole, regionName: '', districtName: '' })
            }
            className={inputClass}
          >
            <option value="">Select a role...</option>
            <option value="PRO-IS">PRO-IS (national)</option>
            <option value="SRO-FS">SRO-FS (regional)</option>
            <option value="DRO">DRO (district)</option>
          </select>
        </Field>
        {(form.role === 'SRO-FS' || form.role === 'DRO') && (
          <Field label="Region">
            <select
              value={form.regionName}
              onChange={(e) => setForm({ ...form, regionName: e.target.value, districtName: '' })}
              className={inputClass}
            >
              <option value="">Select a region...</option>
              {regionNames.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        )}
        {form.role === 'DRO' && form.regionName && (
          <Field label="District">
            <select
              value={form.districtName}
              onChange={(e) => setForm({ ...form, districtName: e.target.value })}
              className={inputClass}
            >
              <option value="">Select a district...</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
    </AdminDialog>
  )
}
