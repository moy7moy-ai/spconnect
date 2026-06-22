export const ROLES = [
  { key: 'super_admin', label: 'Super Administrador' },
  { key: 'admin',       label: 'Administrador' },
  { key: 'editor',      label: 'Editor' },
  { key: 'viewer',      label: 'Viewer' },
] as const

export type RoleKey = (typeof ROLES)[number]['key']
