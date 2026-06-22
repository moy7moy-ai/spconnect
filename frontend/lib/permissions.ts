import type { AuthUser } from './auth'
import { MODULES, type ModuleKey } from '@/config/modules'

export type PermissionLevel = 'full' | 'ver' | 'none'

export function getPermission(user: AuthUser, moduleKey: ModuleKey): PermissionLevel {
  if (user.perfil === 'super_admin') return 'full'
  return (user.permisos?.[moduleKey] as PermissionLevel) ?? 'none'
}

export function canAccess(user: AuthUser, moduleKey: ModuleKey): boolean {
  return getPermission(user, moduleKey) !== 'none'
}

export function canEdit(user: AuthUser, moduleKey: ModuleKey): boolean {
  return getPermission(user, moduleKey) === 'full'
}

export function isSuperAdmin(user: AuthUser): boolean {
  return user.perfil === 'super_admin'
}

export function getActiveModules(user: AuthUser): ModuleKey[] {
  if (!user.tenant?.modulos_activos) return []
  return MODULES
    .filter(m => user.tenant!.modulos_activos[m.key])
    .map(m => m.key)
}
