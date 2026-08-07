import { requireRole } from '@/lib/auth'
import Link from 'next/link'
import {
  Building2,
  Users,
  ShieldCheck,
  UserCog,
  FileSignature,
  Upload,
  RefreshCw,
  BellRing,
  ScrollText,
  History,
  Code2,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface SettingsLink {
  label: string
  href: string
  description: string
  icon: React.ReactNode
}

interface SettingsGroup {
  title: string
  description: string
  links: SettingsLink[]
}

const GROUPS: SettingsGroup[] = [
  {
    title: 'Organisation',
    description: 'Centres, people and who can approve what',
    links: [
      {
        label: 'Centres',
        href: '/settings/centres',
        description: 'Hospital units and their codes used across POs, GRNs and reports',
        icon: <Building2 size={18} />,
      },
      {
        label: 'Users',
        href: '/settings/users',
        description: 'User accounts, roles and centre assignments',
        icon: <Users size={18} />,
      },
      {
        label: 'Approval Matrix',
        href: '/settings/approvals',
        description: 'Value thresholds that decide who approves each purchase order',
        icon: <ShieldCheck size={18} />,
      },
      {
        label: 'Delegations',
        href: '/settings/delegations',
        description: 'Temporarily hand approval authority to another user',
        icon: <UserCog size={18} />,
      },
    ],
  },
  {
    title: 'Procurement Setup',
    description: 'Negotiated rates and bulk data loading',
    links: [
      {
        label: 'Rate Contracts',
        href: '/settings/rate-contracts',
        description: 'Agreed vendor rates and validity periods applied to new POs',
        icon: <FileSignature size={18} />,
      },
      {
        label: 'Data Import',
        href: '/settings/data-import',
        description: 'Bulk load vendors, items and opening stock from spreadsheets',
        icon: <Upload size={18} />,
      },
    ],
  },
  {
    title: 'Integrations & Alerts',
    description: 'Accounting sync and expiry notifications',
    links: [
      {
        label: 'Tally Sync',
        href: '/settings/tally',
        description: 'Queue-based push of invoices, payments and masters to Tally',
        icon: <RefreshCw size={18} />,
      },
      {
        label: 'Document Alerts',
        href: '/settings/document-alerts',
        description: 'Warn before vendor licences and certificates expire',
        icon: <BellRing size={18} />,
      },
      {
        label: 'API Docs',
        href: '/settings/api-docs',
        description: 'Endpoint reference for the HMIS bridge and external integrations',
        icon: <Code2 size={18} />,
      },
    ],
  },
  {
    title: 'Compliance',
    description: 'Traceability for audits',
    links: [
      {
        label: 'Audit Log',
        href: '/settings/audit-log',
        description: 'Every create, update and delete recorded against a user',
        icon: <ScrollText size={18} />,
      },
      {
        label: 'Audit Trail',
        href: '/settings/audit-trail',
        description: 'Approval history and status transitions per document',
        icon: <History size={18} />,
      },
    ],
  },
]

export default async function SettingsPage() {
  await requireRole(['group_admin', 'group_cao'])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">
            Configure centres, approvals, integrations and compliance for Health1 VPMS
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {GROUPS.map(group => (
          <section key={group.title} aria-labelledby={`settings-${group.title.replace(/\s+/g, '-').toLowerCase()}`}>
            <div className="mb-3">
              <h2
                id={`settings-${group.title.replace(/\s+/g, '-').toLowerCase()}`}
                className="text-sm font-semibold uppercase tracking-wide text-gray-500"
              >
                {group.title}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">{group.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {group.links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="card p-5 cursor-pointer transition-colors duration-200 hover:border-teal-300 hover:bg-teal-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 rounded-lg bg-teal-50 p-2 text-teal-700">
                      {link.icon}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900">{link.label}</h3>
                      <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
