import type { Metadata } from 'next'
import { AdminPanel } from '@/components/admin/admin-panel'

export const metadata: Metadata = {
  title: 'PRO-IS Admin | DRO 100-Day Exercise',
  description:
    'Programme super-admin panel for the DRO 100-Day Performance Exercise — national overview, programme targets, users, suspensions and audit log.',
}

export default function AdminPage() {
  return <AdminPanel />
}
