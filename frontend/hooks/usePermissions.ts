'use client'

import { useAuth } from './useAuth'
import { canAccess, canEdit, isSuperAdmin, type PermissionLevel, getPermission } from '@/lib/permissions'
import type { ModuleKey } from '@/config/modules'

export function usePermissions() {
  const { user } = useAuth()

  return {
    isSuperAdmin: user ? isSuperAdmin(user) : false,
    can:          (mod: ModuleKey) => user ? canAccess(user, mod) : false,
    canEdit:      (mod: ModuleKey) => user ? canEdit(user, mod)   : false,
    level:        (mod: ModuleKey): PermissionLevel => user ? getPermission(user, mod) : 'none',
  }
}
