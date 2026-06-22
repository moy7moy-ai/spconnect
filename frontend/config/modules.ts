export const MODULES = [
  { key: 'modulo_1', label: 'Módulo 1', icon: '📦' },
  { key: 'modulo_2', label: 'Módulo 2', icon: '📊' },
] as const

export type ModuleKey = (typeof MODULES)[number]['key']
