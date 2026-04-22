// Admin RBAC nav configuration.
//
// Client-side gating for sidebar items. The API is the authoritative
// source of truth (every endpoint re-checks role via
// `requireAdminRole(...)`), so hiding a nav item here is UX only —
// it does not grant or revoke permission. Any item surfaced must
// still be allowed at the backend route layer.

import type { AdminRole } from '@creatorhub/shared'

export interface NavItem {
  label: string
  href: string
  roles: AdminRole[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/',
        roles: [
          'super_admin',
          'content_moderator',
          'support',
          'finance',
          'operations',
        ],
      },
    ],
  },
  {
    label: 'Trust & Safety',
    items: [
      {
        label: 'Users',
        href: '/users',
        roles: ['super_admin', 'content_moderator', 'support'],
      },
      {
        label: 'KYC Queue',
        href: '/kyc',
        roles: ['super_admin', 'support'],
      },
      {
        label: 'Moderation',
        href: '/moderation',
        roles: ['super_admin', 'content_moderator'],
      },
    ],
  },
  {
    label: 'Money',
    items: [
      {
        label: 'Payouts',
        href: '/payouts',
        roles: ['super_admin', 'finance'],
      },
      {
        label: 'Refunds',
        href: '/refunds',
        roles: ['super_admin', 'finance'],
      },
    ],
  },
  {
    label: 'Growth',
    items: [
      {
        label: 'Editorial',
        href: '/editorial',
        roles: ['super_admin', 'content_moderator'],
      },
      {
        label: 'Search Analytics',
        href: '/analytics/search',
        roles: [
          'super_admin',
          'content_moderator',
          'support',
          'finance',
          'operations',
        ],
      },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Admins', href: '/admins', roles: ['super_admin'] },
      {
        label: 'Audit Log',
        href: '/audit',
        roles: [
          'super_admin',
          'content_moderator',
          'support',
          'finance',
          'operations',
        ],
      },
    ],
  },
]

export function visibleNav(role: AdminRole): NavGroup[] {
  return NAV.map((group) => ({
    label: group.label,
    items: group.items.filter((i) => i.roles.includes(role)),
  })).filter((group) => group.items.length > 0)
}

const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  content_moderator: 'Content Moderator',
  support: 'Support',
  finance: 'Finance',
  operations: 'Operations',
}

export function roleLabel(role: AdminRole): string {
  return ROLE_LABEL[role]
}

const ROLE_BADGE_COLOR: Record<AdminRole, string> = {
  super_admin: 'var(--color-role-super)',
  content_moderator: 'var(--color-role-moderator)',
  support: 'var(--color-role-support)',
  finance: 'var(--color-role-finance)',
  operations: 'var(--color-role-operations)',
}

export function roleColor(role: AdminRole): string {
  return ROLE_BADGE_COLOR[role]
}
