'use client'

import { useEffect, useState } from 'react'
import { Activity, ShieldCheck, LogIn } from 'lucide-react'

function useClock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

interface SiteUser {
  name: string
  role: string
  scope: string
}

export function SiteHeader({ user }: { user?: SiteUser }) {
  const now = useClock()
  const initials = user
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : ''
  const time = now
    ? now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--'
  const date = now
    ? now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    : ''

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold leading-tight text-foreground md:text-base">
              Directorate of Registration &amp; Operations
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              100-Day Performance Exercise — Pilot Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <div className="hidden text-right sm:block">
            <div className="font-mono text-sm font-semibold tabular-nums text-foreground">{time}</div>
            <div className="font-mono text-[11px] text-muted-foreground">{date}</div>
          </div>
          {user ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card py-1.5 pl-1.5 pr-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </span>
              <div className="hidden leading-tight sm:block">
                <div className="text-sm font-medium text-foreground">{user.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  <span className="font-semibold text-accent-foreground">{user.role}</span>
                  {` · ${user.scope}`}
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <LogIn className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign in</span>
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-accent/40">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-1.5 md:px-6">
          <Activity className="size-3.5 shrink-0 text-accent-foreground" aria-hidden="true" />
          <p className="truncate text-[11px] text-accent-foreground">
            Pilot / prototype for internal study purposes — not an official production system. Placeholder branding only.
          </p>
        </div>
      </div>
    </header>
  )
}
