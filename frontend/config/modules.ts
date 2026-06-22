export const MODULES = [
  { key: 'inicio',      label: 'Inicio',      icon: '🏠' },
  { key: 'facturacion', label: 'Facturación',  icon: '💰' },
  { key: 'tickets',     label: 'Soporte',      icon: '🎫' },
  { key: 'reportes',    label: 'Reportes',     icon: '📊' },
] as const

export type ModuleKey = (typeof MODULES)[number]['key']
