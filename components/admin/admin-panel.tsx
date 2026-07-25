'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Target,
  Upload,
  FileBarChart,
  Users,
  UserPlus,
  Megaphone,
  UserCog,
  PauseCircle,
  ScrollText,
  Menu,
  X,
  Bell,
  ArrowLeftRight,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ToastProvider } from './toast'
import { RolePill } from './ui'
import { AdminOverview } from './sections/overview'
import { ProgrammeTargets } from './sections/programme-targets'
import { UsersSection } from './sections/users'
import { SuspensionsSection } from './sections/suspensions'
import { AuditLogSection } from './sections/audit-log'
import { AddRaSection } from './sections/add-ra'
import { PlaceholderSection } from './sections/placeholder'

type SectionId =
  | 'overview'
  | 'programmes'
  | 'uploads'
  | 'reports'
  | 'add-ra'
  | 'ra-replacements'
  | 'broadcast'
  | 'users'
  | 'suspensions'
  | 'audit'

interface NavItem {
  id: SectionId
  label: string
  icon: typeof LayoutDashboard
  group: 'Monitor' | 'Operations' | 'RA Management' | 'Administration'
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'Monitor' },
  { id: 'programmes', label: 'Programme Targets', icon: Target, group: 'Monitor' },
  { id: 'uploads', label: 'Data Uploads', icon: Upload, group: 'Operations' },
  { id: 'reports', label: 'Reports', icon: FileBarChart, group: 'Operations' },
  { id: 'broadcast', label: 'Broadcast', icon: Megaphone, group: 'Operations' },
  { id: 'add-ra', label: 'Add New RA', icon: UserPlus, group: 'RA Management' },
  { id: 'ra-replacements', label: 'RA Replacements', icon: Users, group: 'RA Management' },
  { id: 'users', label: 'Users', icon: UserCog, group: 'Administration' },
  { id: 'suspensions', label: 'Suspensions', icon: PauseCircle, group: 'Administration' },
  { id: 'audit', label: 'Audit Log', icon: ScrollText, group: 'Administration' },
]

const groups: NavItem['group'][] = ['Monitor', 'Operations', 'RA Management', 'Administration']

export function AdminPanel() {
  const [section, setSection] = useState<SectionId>('overview')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const active = navItems.find((n) => n.id === section)!

  function go(id: SectionId) {
    setSection(id)
    setDrawerOpen(false)
  }

  return (
    <ToastProvider>
      <div className="min-h-svh bg-background lg:flex">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
          <SidebarContent section={section} onNavigate={go} />
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            />
            <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-sidebar-border bg-sidebar">
              <SidebarContent section={section} onNavigate={go} onClose={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          {/* Top header */}
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur md:px-6">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex size-10 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted lg:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
              <span className="sr-only">Open menu</span>
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                National Operations Centre
              </p>
              <h1 className="truncate text-sm font-semibold text-foreground">{active.label}</h1>
            </div>

            <RolePill role="PRO-IS" />

            <button
              type="button"
              className="relative flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Bell className="size-5" aria-hidden="true" />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-critical" aria-hidden="true" />
              <span className="sr-only">Notifications</span>
            </button>

            <div className="hidden items-center gap-2.5 rounded-lg border border-border bg-card py-1.5 pl-1.5 pr-3 sm:flex">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                AM
              </span>
              <div className="leading-tight">
                <div className="text-sm font-medium text-foreground">Aloysius Mwanga</div>
                <div className="text-[11px] text-muted-foreground">Programme super-admin</div>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
            {section === 'overview' && <AdminOverview onNavigateProgrammes={() => go('programmes')} />}
            {section === 'programmes' && <ProgrammeTargets />}
            {section === 'users' && <UsersSection />}
            {section === 'suspensions' && <SuspensionsSection />}
            {section === 'audit' && <AuditLogSection />}
            {section === 'add-ra' && <AddRaSection />}
            {section === 'uploads' && (
              <PlaceholderSection
                title="Data Uploads"
                description="Bulk-import daily district returns from CSV/Excel and reconcile them against RA rosters."
              />
            )}
            {section === 'reports' && (
              <PlaceholderSection
                title="Reports"
                description="Generate and export national, regional and programme performance reports for the exercise."
              />
            )}
            {section === 'ra-replacements' && (
              <PlaceholderSection
                title="RA Replacements"
                description="Review and approve registration-assistant replacement requests raised by regional supervisors."
              />
            )}
            {section === 'broadcast' && (
              <PlaceholderSection
                title="Broadcast"
                description="Send announcements and operational notices to SRO-FS and DRO officers across all regions."
              />
            )}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}

function SidebarContent({
  section,
  onNavigate,
  onClose,
}: {
  section: SectionId
  onNavigate: (id: SectionId) => void
  onClose?: () => void
}) {
  return (
    <>
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold text-sidebar-foreground">DRO Monitor</div>
          <div className="truncate text-[11px] text-muted-foreground">100-Day Exercise</div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Close menu</span>
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group} className="mb-5">
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group}
            </p>
            <ul className="space-y-0.5">
              {navItems
                .filter((n) => n.group === group)
                .map((item) => {
                  const Icon = item.icon
                  const isActive = section === item.id
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onNavigate(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        )}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden="true" />
                        {item.label}
                      </button>
                    </li>
                  )
                })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ArrowLeftRight className="size-4 shrink-0" aria-hidden="true" />
          Switch to DRO view
        </Link>
      </div>
    </>
  )
}
