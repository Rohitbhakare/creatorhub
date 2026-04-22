import Link from 'next/link'
import { visibleNav } from '../lib/rbac'
import type { AdminRole } from '../lib/types'

export function Sidebar({ role }: { role: AdminRole }): React.JSX.Element {
  const groups = visibleNav(role)

  return (
    <aside
      className="w-60 shrink-0 border-r h-screen sticky top-0 overflow-y-auto py-6"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="px-6 mb-6">
        <div className="font-semibold text-lg">CreatorHub</div>
        <div
          className="text-xs uppercase tracking-wide"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Admin
        </div>
      </div>

      <nav className="flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col">
            <div
              className="px-6 text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: 'var(--color-text-subtle)' }}
            >
              {group.label}
            </div>
            <ul className="flex flex-col">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block px-6 py-2 text-sm hover:bg-[var(--color-surface-muted)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
