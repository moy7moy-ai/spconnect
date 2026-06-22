export const ROLES = [
  { key: 'super_admin', label: 'Super Administrador' },
  { key: 'admin',       label: 'Administrador' },
  { key: 'viewer',      label: 'Solo lectura' },
] as const

export type RoleKey = (typeof ROLES)[number]['key']
